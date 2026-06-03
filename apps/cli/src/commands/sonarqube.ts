import { existsSync, mkdirSync, readFileSync, writeFileSync, rmdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { Command } from 'commander';
import { Configuration } from '@smmachine/core/infrastructure/configuration';
import { Logger } from '@smmachine/utils';
import { SonarqubeMeasuresClient } from '@smmachine/core/providers/sonarqube/sonarqube-client';
import { SonarqubeFetchMetricsRepository } from '@smmachine/core/providers/sonarqube/sonarqube-fetch-metrics-repository';

const logger = new Logger('SonarQubeCommand');

type CommandExecutionResult = {
  code: number;
  stdout: string;
  stderr: string;
};

type LocalSonarqubeTokenData = {
  generatedAt: string;
  token: string;
  tokenName: string;
  serverUrl: string;
  login?: string;
  username?: string;
  password?: string;
  passwordUpdatedAt?: string;
};

type SonarqubeContainerUrls = {
  internalUrl: string;
  hostUrl: string;
};

const LOCAL_SONARQUBE_TOKEN_FILE = 'local_sonarqube_data.json';
const LOCAL_SONARQUBE_TOKEN_NAME = 'smm-sonarqube-local-token';
const SONARQUBE_READY_TIMEOUT_MS = 5 * 60 * 1000;
const SONARQUBE_READY_INTERVAL_MS = 5000;

function runCommand(
  command: string,
  args: string[],
  options: { captureOutput?: boolean } = {}
): Promise<CommandExecutionResult> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      stdio: options.captureOutput ? 'pipe' : 'inherit',
    });

    let stdout = '';
    let stderr = '';

    if (options.captureOutput) {
      child.stdout?.on('data', (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr?.on('data', (chunk) => {
        stderr += chunk.toString();
      });
    }

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      resolvePromise({
        code: code ?? 1,
        stdout,
        stderr,
      });
    });
  });
}

async function assertDockerAvailable(): Promise<void> {
  const result = await runCommand('docker', ['--version'], { captureOutput: true });
  if (result.code !== 0) {
    throw new Error(
      `Docker is required to run SonarQube analysis. ${result.stderr || result.stdout}`
    );
  }
}

async function getContainerState(containerName: string): Promise<'running' | 'stopped' | 'missing'> {
  const result = await runCommand(
    'docker',
    ['inspect', '-f', '{{.State.Running}}', containerName],
    { captureOutput: true }
  );

  if (result.code !== 0) {
    return 'missing';
  }

  const state = result.stdout.trim().toLowerCase();
  if (state === 'true') {
    return 'running';
  }

  return 'stopped';
}

async function getContainerHostUrlWithFallbackPort(
  containerName: string,
  fallbackPort: string
): Promise<SonarqubeContainerUrls> {
  const result = await runCommand('docker', ['inspect', containerName], {
    captureOutput: true,
  });

  if (result.code !== 0) {
    throw new Error(`Failed to inspect SonarQube container network for "${containerName}".`);
  }

  let inspectPayload: unknown;
  try {
    inspectPayload = JSON.parse(result.stdout);
  } catch {
    throw new Error(`Failed to parse docker inspect output for "${containerName}".`);
  }

  const inspectList = Array.isArray(inspectPayload)
    ? (inspectPayload as Array<Record<string, unknown>>)
    : [];
  const inspect = inspectList[0] ?? {};

  const networkSettings = (inspect.NetworkSettings ?? {}) as Record<string, unknown>;
  const ports = (networkSettings.Ports ?? {}) as Record<
    string,
    Array<Record<string, unknown>> | null
  >;
  const preferredPortKey = `${fallbackPort}/tcp`;
  const publishedPortEntries = Object.entries(ports);
  const portEntry = ports[preferredPortKey] ?? publishedPortEntries[0]?.[1] ?? null;
  const publishedPort = Array.isArray(portEntry) && portEntry.length > 0 ? portEntry[0] : undefined;

  const hostIp = String(publishedPort?.HostIp ?? '').trim();
  const hostPort = String(publishedPort?.HostPort ?? fallbackPort).trim();

  const networks = (networkSettings.Networks ?? {}) as Record<string, unknown>;
  const networkEntries = Object.values(networks) as Array<Record<string, unknown>>;
  const firstNetwork = networkEntries[0] ?? {};
  const containerIp = String(firstNetwork.IPAddress ?? '').trim();

  if (!hostPort) {
    throw new Error(`Could not resolve SonarQube host port for "${containerName}".`);
  }

  if (!containerIp) {
    throw new Error(`Could not resolve SonarQube container IP for "${containerName}".`);
  }

  const normalizedHostIp = hostIp === '0.0.0.0' || hostIp === '::' || hostIp.length === 0 ? 'localhost' : hostIp;

  return {
    internalUrl: `http://${containerIp}:${fallbackPort}`,
    hostUrl: `http://${normalizedHostIp}:${hostPort}`,
  };
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolvePromise) => {
    setTimeout(resolvePromise, milliseconds);
  });
}

async function waitForSonarqubeReady(containerName: string): Promise<void> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < SONARQUBE_READY_TIMEOUT_MS) {
    const result = await runCommand(
      'docker',
      ['logs', '--tail', '200', containerName],
      { captureOutput: true }
    );

    if (result.stdout.includes('SonarQube is operational')) {
      return;
    }

    await sleep(SONARQUBE_READY_INTERVAL_MS);
  }

  throw new Error(
    `SonarQube did not become operational within the expected timeout for container "${containerName}".`
  );
}

function getLocalSonarqubeTokenPath(config: Configuration): string {
  return resolve(config.getSonarqubePath(), LOCAL_SONARQUBE_TOKEN_FILE);
}

function normalizeUrl(url: string): string {
  return url.replace(/\/$/, '');
}

function readLocalSonarqubeData(
  filePath: string,
  hostUrl: string
): Partial<LocalSonarqubeTokenData> | undefined {
  if (!existsSync(filePath)) {
    return undefined;
  }

  try {
    const contents = readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(contents) as Partial<LocalSonarqubeTokenData>;
    const normalizedStoredUrl = typeof parsed.serverUrl === 'string' ? normalizeUrl(parsed.serverUrl) : '';
    const normalizedHostUrl = normalizeUrl(hostUrl);

    if (normalizedStoredUrl && normalizedStoredUrl !== normalizedHostUrl) {
      return undefined;
    }

    return parsed;
  } catch {
    return undefined;
  }
}

function writeLocalSonarqubeData(
  filePath: string,
  hostUrl: string,
  data: Partial<LocalSonarqubeTokenData>
): void {
  const current = readLocalSonarqubeData(filePath, hostUrl) ?? {};
  const merged: Partial<LocalSonarqubeTokenData> = {
    ...current,
    ...data,
    serverUrl: normalizeUrl(hostUrl),
  };

  mkdirSync(resolve(filePath, '..'), { recursive: true });
  writeFileSync(filePath, JSON.stringify(merged, null, 2), 'utf-8');
}

function readLocalSonarqubeToken(filePath: string, hostUrl: string): string | undefined {
  const parsed = readLocalSonarqubeData(filePath, hostUrl);
  return typeof parsed?.token === 'string' && parsed.token.length > 0 ? parsed.token : undefined;
}

function readLocalSonarqubePassword(filePath: string, hostUrl: string): string | undefined {
  const parsed = readLocalSonarqubeData(filePath, hostUrl);
  return typeof parsed?.password === 'string' && parsed.password.length > 0 ? parsed.password : undefined;
}

function buildLocalSonarqubePassword(): string {
  return `smm-${randomBytes(18).toString('base64url')}`;
}

async function updateLocalSonarqubePassword(options: {
  filePath: string;
  hostUrl: string;
  username: string;
  previousPassword: string;
  newPassword: string;
}): Promise<string> {
  const sanitizedHostUrl = normalizeUrl(options.hostUrl);
  const endpoint = `${sanitizedHostUrl}/api/users/change_password`;
  const body = new URLSearchParams({
    login: options.username,
    previousPassword: options.previousPassword,
    password: options.newPassword,
  }).toString();

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${options.username}:${options.previousPassword}`).toString('base64')}`,
    },
    body,
  });

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(
      `Failed to update SonarQube admin password. ${response.status} ${response.statusText}${responseBody ? ` - ${responseBody}` : ''}`
    );
  }

  writeLocalSonarqubeData(options.filePath, sanitizedHostUrl, {
    password: options.newPassword,
    passwordUpdatedAt: new Date().toISOString(),
  });

  return options.newPassword;
}

async function ensureLocalSonarqubePassword(options: {
  filePath: string;
  hostUrl: string;
  username: string;
  defaultPassword: string;
}): Promise<string> {
  const storedPassword = readLocalSonarqubePassword(options.filePath, options.hostUrl);
  if (storedPassword) {
    return storedPassword;
  }

  const newPassword = buildLocalSonarqubePassword();
  return updateLocalSonarqubePassword({
    filePath: options.filePath,
    hostUrl: options.hostUrl,
    username: options.username,
    previousPassword: options.defaultPassword,
    newPassword,
  });
}

async function generateLocalSonarqubeToken(options: {
  filePath: string;
  hostUrl: string;
  username: string;
  password: string;
  tokenName: string;
}): Promise<string> {
  const sanitizedHostUrl = options.hostUrl.replace(/\/$/, '');

  const response = await fetch(`${sanitizedHostUrl}/api/user_tokens/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${options.username}:${options.password}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      name: options.tokenName,
    }).toString(),
  });

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(
      `Failed to generate SonarQube token. ${response.status} ${response.statusText}${responseBody ? ` - ${responseBody}` : ''}`
    );
  }

  let payload: Partial<LocalSonarqubeTokenData>;
  try {
    payload = (await response.json()) as Partial<LocalSonarqubeTokenData>;
  } catch {
    throw new Error('SonarQube token generation returned invalid JSON.');
  }

  if (!payload.token) {
    throw new Error('SonarQube token generation response did not include a token.');
  }

  const cachedToken: Partial<LocalSonarqubeTokenData> = {
    generatedAt: new Date().toISOString(),
    token: payload.token,
    tokenName: options.tokenName,
    serverUrl: sanitizedHostUrl,
    login: payload.login,
  };
  writeLocalSonarqubeData(options.filePath, sanitizedHostUrl, cachedToken);

  return payload.token;
}

async function getLocalSonarqubeToken(options: {
  config: Configuration;
  hostUrl: string;
  username: string;
  password: string;
}): Promise<string> {
  const filePath = getLocalSonarqubeTokenPath(options.config);
  const cachedToken = readLocalSonarqubeToken(filePath, options.hostUrl);
  if (cachedToken) {
    return cachedToken;
  }

  return generateLocalSonarqubeToken({
    filePath,
    hostUrl: options.hostUrl,
    username: options.username,
    password: options.password,
    tokenName: LOCAL_SONARQUBE_TOKEN_NAME,
  });
}

function createSonarqubeOrchestrator() {
  const config = new Configuration(process.env);
  const sonarqubeClient = new SonarqubeMeasuresClient(
    config.sonarUrl || '',
    config.sonarToken || '',
    config.sonarProject || ''
  );

  return new SonarqubeFetchMetricsRepository(sonarqubeClient, config);
}

/**
 * SonarQube Command Group
 *
 * Provides CLI commands for SonarQube integration matching Python CLI functionality.
 *
 * Commands:
 *   smm sonarqube fetch-measures   Fetch quality measures from SonarQube
 *   smm sonarqube fetch-component-tree   Fetch component tree from SonarQube
 */
export function createSonarQubeCommands(program: Command): void {
  const sonarqubeGroup = program
    .command('sonarqube')
    .description('SonarQube integration operations');

  const sonarqubeAnalysisGroup = sonarqubeGroup
    .command('analysis')
    .description('Run local SonarQube analysis through Docker');

  sonarqubeAnalysisGroup
    .command('run')
    .description('Start local SonarQube (if needed) and execute sonar-scanner in Docker')
    .option('--container-server-name <name>', 'SonarQube container name', 'sonarqube')
    .option('--scanner-container-name <name>', 'SonarQube scanner container name', 'sonarqube-scanner')
    .option('--container-server-image <image>', 'SonarQube Docker image', 'sonarqube:community')
    .option('--scanner-image <image>', 'Sonar scanner Docker image', 'sonarsource/sonar-scanner-cli')
    .option('--data-dir <path>', 'Host path mounted to /opt/sonarqube/data', './sonarqube_data')
    .option('--server-port <number>', 'Host port mapped to SonarQube container port 9000', '9000')
    .option('--scanner-host-url <url>', 'SONAR_HOST_URL passed to scanner (overrides container-derived URL)')
    .option('--scanner-token <token>', 'SONAR_TOKEN passed to scanner')
    .option('--properties <value>', 'Raw SONAR_SCANNER_OPTS value passed directly to scanner')
    .option('--admin-user <user>', 'Predefined local SonarQube admin username', 'admin')
    .option('--admin-password <password>', 'Predefined local SonarQube admin password', 'admin')
    .action(async (options) => {
      try {
        const config = new Configuration(process.env);
        await assertDockerAvailable();

        const containerName = String(options.containerServerName);
        const scannerContainerName = String(options.scannerContainerName);
        const containerImage = String(options.containerServerImage);
        const scannerImage = String(options.scannerImage);
        const dataDirectory = resolve(String(options.dataDir));
        const sourceDirectory = resolve(String(config.gitRepositoryLocation));
        const hostPort = String(options.serverPort);
        const scannerOptions = String(options.properties || '').trim();
        const localAdminUser = String(options.adminUser);
        const localAdminPassword = String(options.adminPassword);

        const containerState = await getContainerState(containerName);
        if (containerState === 'running') {
          logger.info(`ℹ️ SonarQube container "${containerName}" is already running. Skipping startup.`);
        } else if (containerState === 'stopped') {
          logger.info(`🔄 Starting existing SonarQube container "${containerName}"...`);
          const startResult = await runCommand('docker', ['start', containerName]);
          if (startResult.code !== 0) {
            throw new Error(`Failed to start SonarQube container "${containerName}".`);
          }
          logger.info('⏳ Waiting for SonarQube to become operational...');
          await waitForSonarqubeReady(containerName);
        } else {
          // start fresh. file that stores local data should be deleted to avoid confusion with previous instance data (e.g. if container was recreated or host/port changed)
          const localSonarqubeTokenPath = getLocalSonarqubeTokenPath(config);
          if (existsSync(localSonarqubeTokenPath)) {
            logger.info(
              `🧹 Removing existing local SonarQube token data at "${localSonarqubeTokenPath}" to ensure clean state for new container.`
            );
            try {
              rmdirSync(localSonarqubeTokenPath);
            } catch (error) {
              logger.warn(
                `Failed to clear local Sonarqube token data at "${localSonarqubeTokenPath}". You may want to manually delete this file to remove stale data: ${error}`
              );
            }
          }
          logger.info(`🚀 Starting SonarQube Community container "${containerName}"...`);
          const sonarqubeDockerRunArgs = [
            'run',
            '-d',
            '-v',
            `${dataDirectory}:/opt/sonarqube/data`,
            '--name',
            containerName,
            '-e',
            `SONARQUBE_ADMIN_USER=${localAdminUser}`,
            '-e',
            `SONARQUBE_ADMIN_PASSWORD=${localAdminPassword}`,
            '-p',
            `${hostPort}:9000`,
            containerImage,
          ];
          logger.debug(`ℹ️ Running command: docker ${sonarqubeDockerRunArgs.join(' ')}`);
          const runResult = await runCommand('docker', sonarqubeDockerRunArgs);

          if (runResult.code !== 0) {
            throw new Error(`Failed to run SonarQube container "${containerName}".`);
          }
        }

        logger.info('⏳ Waiting for SonarQube to become operational...');
        await waitForSonarqubeReady(containerName);

        logger.info(
          `🔐 Local SonarQube login (default) is ${options.adminUser}/${options.adminPassword}.`
        );

        const sonarqubeUrls = await getContainerHostUrlWithFallbackPort(containerName, hostPort);
        const hostUrl = options.scannerHostUrl
          ? String(options.scannerHostUrl).trim()
          : sonarqubeUrls.hostUrl;

        logger.info(`ℹ️ SonarQube internal URL: ${sonarqubeUrls.internalUrl}`);
        logger.info(`ℹ️ SonarQube host URL: ${sonarqubeUrls.hostUrl}`);

        const localSonarqubeFilePath = getLocalSonarqubeTokenPath(config);
        const effectiveAdminPassword = await ensureLocalSonarqubePassword({
          filePath: localSonarqubeFilePath,
          hostUrl,
          username: localAdminUser,
          defaultPassword: localAdminPassword,
        });

        const sonarToken = options.scannerToken ||
          (await getLocalSonarqubeToken({
            config,
            hostUrl,
            username: localAdminUser,
            password: effectiveAdminPassword,
          }));
        const scannerArgs = [
          'run',
          '--rm',
          `--name=${scannerContainerName}`,
          '-e',
          `SONAR_HOST_URL=${sonarqubeUrls.internalUrl}`,
        ];

        if (sonarToken) {
          scannerArgs.push('-e', `SONAR_TOKEN=${sonarToken}`);
        }

        if (scannerOptions.length > 0) {
          scannerArgs.push('-e', `SONAR_SCANNER_OPTS=${scannerOptions}`);
        }

        scannerArgs.push('-v', `${sourceDirectory}:/usr/src`, scannerImage);

        logger.info('🔎 Running SonarQube scanner... ');
        const scannerResult = await runCommand('docker', scannerArgs);
        if (scannerResult.code !== 0) {
          throw new Error('SonarQube scanner execution failed.');
        }

        logger.info('✅ SonarQube analysis has been completed');
      } catch (error) {
        logger.error('Failed to run SonarQube analysis', error);
        process.exit(1);
      }
    });

  /**
   * smm sonarqube fetch-measures [options]
   * Fetch quality measures from SonarQube
   */
  sonarqubeGroup
    .command('fetch-measures')
    .description('Fetch quality measures from SonarQube')
    .option(
      '--metrics <list>',
      'Comma-separated list of metrics to fetch (default: coverage,sqale_rating,complexity,duplicated_lines_density)'
    )
    .option('--output <format>', 'Output format (text|json)', 'text')
    .action(async (options) => {
      try {
        logger.info('🔄 Fetching quality measures from SonarQube...');

        const orchestrator = createSonarqubeOrchestrator();

        const metricsParam = options.metrics
          ? { metrics: options.metrics.split(',').map((m: string) => m.trim()) }
          : undefined;

        const measures = await orchestrator.fetchQualityMetrics(metricsParam);

        if (options.output === 'json') {
          console.log(JSON.stringify(measures, null, 2));
        } else {
          console.log('\n=== SonarQube Quality Measures ===\n');
          const measureList = Array.isArray(measures.measures) ? measures.measures : [];
          console.log(`Measures Fetched: ${measureList.length}`);
          console.log(`Project Key: ${measures.key || 'N/A'}`);
          console.log(`Project Name: ${measures.name || 'N/A'}`);

          if (measureList.length > 0) {
            console.log('\nMeasures:');
            for (const measure of measureList) {
              console.log(`  ${measure.metric || measure.key}: ${measure.value ?? 'N/A'}`);
            }
          }
        }

        logger.info('\n✅ Fetch measures has been completed');
      } catch (error) {
        logger.error('Failed to fetch SonarQube measures', error);
        process.exit(1);
      }
    });

  /**
   * smm sonarqube fetch-component-tree [options]
   * Fetch component tree with metrics from SonarQube
   */
  sonarqubeGroup
    .command('fetch-component-tree')
    .description('Fetch component tree with metrics from SonarQube')
    .option('--component <key>', 'Component key (default: configured SONAR_PROJECT)')
    .option('--depth <number>', 'Depth of tree traversal (-1 for all depths)', '-1')
    .option(
      '--metrics <list>',
      'Comma-separated list of metrics to fetch (default: complexity,cognitive_complexity,ncloc,sqale_rating,coverage)'
    )
    .option('--output <format>', 'Output format (text|json)', 'text')
    .action(async (options) => {
      try {
        console.log('🔄 Fetching component tree from SonarQube...');

        const orchestrator = createSonarqubeOrchestrator();

        const parsedDepth = Number.parseInt(options.depth, 10);
        if (Number.isNaN(parsedDepth)) {
          throw new Error('--depth must be a valid integer');
        }

        const treeOptions = {
          component: options.component,
          depth: parsedDepth,
          metrics: options.metrics
            ? options.metrics.split(',').map((m: string) => m.trim())
            : undefined,
        };

        const components = await orchestrator.fetchComponentTree(treeOptions);

        if (options.output === 'json') {
          console.log(JSON.stringify(components, null, 2));
        } else {
          console.log('\n=== SonarQube Component Tree ===\n');
          console.log(`Components Fetched: ${components.length}`);

          if (components.length > 0) {
            const root = components[0];
            console.log(`Root Component: ${root.key || 'N/A'}`);
            console.log(`Root Name: ${root.name || 'N/A'}`);
          }

          if (components.length > 0) {
            console.log('\nComponents:');
            for (const component of components) {
              const measureCount = Array.isArray(component.measures)
                ? component.measures.length
                : 0;
              console.log(`  ${component.key || 'unknown'} - measures: ${measureCount}`);
            }
          }
        }

        console.log('\n✅ Fetch component tree has been completed');
      } catch (error) {
        logger.error('Failed to fetch SonarQube component tree', error);
        process.exit(1);
      }
    });

  /**
   * smm sonarqube fetch-historical-measures [options]
   * Fetch historical measures from SonarQube and optionally store as JSON
   */
  sonarqubeGroup
    .command('fetch-historical-measures')
    .description('Fetch historical measures from SonarQube')
    .option(
      '--metrics <list>',
      'Comma-separated list of metrics to fetch (default: sqale_rating,coverage,duplicated_lines_density)'
    )
    .option('--start-date <date>', 'Start date in YYYY-MM-DD format')
    .option('--end-date <date>', 'End date in YYYY-MM-DD format')
    .option('--update', 'Incrementally update measures — fetch only newer items since last sync and merge with existing cache')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .option('--save <file>', 'Save results to a JSON file at the given path')
    .action(async (options) => {
      try {
        console.log('🔄 Fetching historical measures from SonarQube...');

        const orchestrator = createSonarqubeOrchestrator();

        const fetchOptions = {
          metrics: options.metrics
            ? options.metrics.split(',').map((m: string) => m.trim())
            : undefined,
          startDate: options.startDate,
          endDate: options.endDate,
          incrementalUpdate: options.update,
        };

        const measures = await orchestrator.fetchHistoricalMeasures(fetchOptions);

        if (options.save) {
          writeFileSync(options.save, JSON.stringify(measures, null, 2), 'utf-8');
          console.log(`\n💾 Results saved to ${options.save}`);
        }

        if (options.output === 'json') {
          console.log(JSON.stringify(measures, null, 2));
        } else {
          console.log('\n=== SonarQube Historical Measures ===\n');
          console.log(`Measurements Fetched: ${measures.length}`);
        }

        console.log('\n✅ Fetch historical measures has been completed');
      } catch (error) {
        logger.error('Failed to fetch SonarQube historical measures', error);
        process.exit(1);
      }
    });
}
