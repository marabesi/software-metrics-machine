import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { Logger } from '@smmachine/utils';
import { Configuration } from '../../infrastructure/configuration';

type CommandExecutionResult = {
  code: number;
  stdout: string;
  stderr: string;
};

export type SonarqubeContainerUrls = {
  internalUrl: string;
  hostUrl: string;
};

export type LocalSonarqubeTokenData = {
  generatedAt?: string;
  token?: string;
  tokenName?: string;
  serverUrl?: string;
  login?: string;
  username?: string;
  password?: string;
  passwordUpdatedAt?: string;
};

export type SonarqubeLocalAnalysisOptions = {
  containerName: string;
  scannerContainerName: string;
  containerImage: string;
  scannerImage: string;
  dataDirectory: string;
  sourceDirectory: string;
  hostPort: string;
  scannerOptions: string;
  adminUser: string;
  adminPassword: string;
  scannerHostUrl?: string;
  scannerToken?: string;
};

const LOCAL_SONARQUBE_TOKEN_FILE = 'local_sonarqube_data.json';
const LOCAL_SONARQUBE_TOKEN_NAME = 'smm-sonarqube-local-token';
const SONARQUBE_READY_TIMEOUT_MS = 5 * 60 * 1000;
const SONARQUBE_READY_INTERVAL_MS = 5_000;

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
      child.stdout?.on('data', (chunk: Buffer) => {
        stdout += chunk.toString();
      });
      child.stderr?.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });
    }

    child.on('error', reject);
    child.on('close', (code) => {
      resolvePromise({ code: code ?? 1, stdout, stderr });
    });
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

function normalizeUrl(url: string): string {
  return url.replace(/\/$/, '');
}

// ─── Class ───────────────────────────────────────────────────────────────────

export class SonarqubeLocalAnalysis {
  private readonly logger: Logger;
  private readonly localDataFilePath: string;

  constructor(private readonly config: Configuration) {
    this.logger = new Logger('SonarqubeLocalAnalysis');
    this.localDataFilePath = resolve(config.getSonarqubePath(), LOCAL_SONARQUBE_TOKEN_FILE);
  }

  async run(options: SonarqubeLocalAnalysisOptions): Promise<void> {
    await this.assertDockerAvailable();

    const containerState = await this.getContainerState(options.containerName);

    if (containerState === 'running') {
      this.logger.info(`ℹ️ SonarQube container "${options.containerName}" is already running. Skipping startup.`);
    } else if (containerState === 'stopped') {
      this.logger.info(`🔄 Starting existing SonarQube container "${options.containerName}"...`);
      const startResult = await runCommand('docker', ['start', options.containerName]);
      if (startResult.code !== 0) {
        throw new Error(`Failed to start SonarQube container "${options.containerName}".`);
      }
    } else {
      this.clearLocalData();

      this.logger.info(`🚀 Starting SonarQube Community container "${options.containerName}"...`);
      const dockerRunArgs = [
        'run', '-d',
        '-v', `${options.dataDirectory}:/opt/sonarqube/data`,
        '--name', options.containerName,
        '-e', `SONARQUBE_ADMIN_USER=${options.adminUser}`,
        '-e', `SONARQUBE_ADMIN_PASSWORD=${options.adminPassword}`,
        '-p', `${options.hostPort}:9000`,
        options.containerImage,
      ];
      this.logger.debug(`Running: docker ${dockerRunArgs.join(' ')}`);

      const runResult = await runCommand('docker', dockerRunArgs);
      if (runResult.code !== 0) {
        throw new Error(`Failed to run SonarQube container "${options.containerName}".`);
      }
    }

    this.logger.info('⏳ Waiting for SonarQube to become operational (this might take a while)...');
    await this.waitForReady(options.containerName);

    const containerUrls = await this.getContainerUrls(options.containerName, options.hostPort);
    const hostUrl = options.scannerHostUrl
      ? normalizeUrl(options.scannerHostUrl)
      : containerUrls.hostUrl;

    this.logger.info(`ℹ️ SonarQube internal URL: ${containerUrls.internalUrl}`);
    this.logger.info(`ℹ️ SonarQube host URL: ${containerUrls.hostUrl}`);

    const effectivePassword = await this.ensurePassword(
      hostUrl,
      options.adminUser,
      options.adminPassword
    );

    const sonarToken =
      options.scannerToken ||
      (await this.getToken(hostUrl, options.adminUser, effectivePassword));

    const scannerArgs = [
      'run', '--rm',
      `--name=${options.scannerContainerName}`,
      '-e', `SONAR_HOST_URL=${containerUrls.internalUrl}`,
    ];

    if (sonarToken) {
      scannerArgs.push('-e', `SONAR_TOKEN=${sonarToken}`);
    }

    if (options.scannerOptions.length > 0) {
      scannerArgs.push('-e', `SONAR_SCANNER_OPTS=${options.scannerOptions}`);
    }

    scannerArgs.push('-v', `${options.sourceDirectory}:/usr/src`, options.scannerImage);

    this.logger.info('🔎 Running SonarQube scanner...');
    const scannerResult = await runCommand('docker', scannerArgs);
    if (scannerResult.code !== 0) {
      throw new Error('SonarQube scanner execution failed.');
    }

    this.logger.info('✅ SonarQube analysis has been completed');
  }

  private async assertDockerAvailable(): Promise<void> {
    const result = await runCommand('docker', ['--version'], { captureOutput: true });
    if (result.code !== 0) {
      throw new Error(
        `Docker is required to run SonarQube analysis. ${result.stderr || result.stdout}`
      );
    }
  }

  private async getContainerState(
    containerName: string
  ): Promise<'running' | 'stopped' | 'missing'> {
    const result = await runCommand(
      'docker',
      ['inspect', '-f', '{{.State.Running}}', containerName],
      { captureOutput: true }
    );

    if (result.code !== 0) {
      return 'missing';
    }

    return result.stdout.trim().toLowerCase() === 'true' ? 'running' : 'stopped';
  }

  async getContainerUrls(
    containerName: string,
    fallbackPort: string
  ): Promise<SonarqubeContainerUrls> {
    const result = await runCommand('docker', ['inspect', containerName], { captureOutput: true });

    if (result.code !== 0) {
      throw new Error(
        `Failed to inspect SonarQube container network for "${containerName}".`
      );
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

    // Host-mapped port
    const ports = (networkSettings.Ports ?? {}) as Record<
      string,
      Array<Record<string, unknown>> | null
    >;
    const preferredKey = `${fallbackPort}/tcp`;
    const allEntries = Object.entries(ports);
    const selectedPortKey = ports[preferredKey] ? preferredKey : (allEntries[0]?.[0] ?? preferredKey);
    const portEntry = ports[selectedPortKey] ?? allEntries[0]?.[1] ?? null;
    const publishedPort =
      Array.isArray(portEntry) && portEntry.length > 0 ? portEntry[0] : undefined;
    const containerPort = selectedPortKey.split('/')[0]?.trim() || fallbackPort;

    const hostIp = String(publishedPort?.HostIp ?? '').trim();
    const hostPort = String(publishedPort?.HostPort ?? fallbackPort).trim();

    if (!hostPort) {
      throw new Error(`Could not resolve SonarQube host port for "${containerName}".`);
    }

    // Container-internal IP
    const networks = (networkSettings.Networks ?? {}) as Record<string, unknown>;
    const networkEntries = Object.values(networks) as Array<Record<string, unknown>>;
    const containerIp = String((networkEntries[0] ?? {}).IPAddress ?? '').trim();

    if (!containerIp) {
      throw new Error(`Could not resolve SonarQube container IP for "${containerName}".`);
    }

    const normalizedHostIp =
      hostIp === '0.0.0.0' || hostIp === '::' || hostIp.length === 0 ? 'localhost' : hostIp;

    return {
      internalUrl: `http://${containerIp}:${containerPort}`,
      hostUrl: `http://${normalizedHostIp}:${hostPort}`,
    };
  }

  private async waitForReady(containerName: string): Promise<void> {
    const startedAt = Date.now();

    while (Date.now() - startedAt < SONARQUBE_READY_TIMEOUT_MS) {
      const result = await runCommand(
        'docker',
        ['logs', '--tail', '5000', containerName],
        { captureOutput: true }
      );

      if (result.code !== 0) {
        throw new Error(
          `Failed to read SonarQube logs while waiting for readiness on container "${containerName}". ${result.stderr || result.stdout}`
        );
      }

      if (
        result.stdout.includes('SonarQube is operational') ||
        result.stderr.includes('SonarQube is operational')
      ) {
        return;
      }

      await sleep(SONARQUBE_READY_INTERVAL_MS);
    }

    throw new Error(
      `SonarQube did not become operational within the expected timeout for container "${containerName}".`
    );
  }

  private clearLocalData(): void {
    if (existsSync(this.localDataFilePath)) {
      this.logger.info(
        `🧹 Removing existing local SonarQube data at "${this.localDataFilePath}" to ensure clean state.`
      );
      try {
        unlinkSync(this.localDataFilePath);
      } catch (error) {
        this.logger.warn(
          `Failed to clear local SonarQube data at "${this.localDataFilePath}". ` +
            `You may want to delete this file manually: ${error}`
        );
      }
    }
  }

  private readLocalData(hostUrl: string): Partial<LocalSonarqubeTokenData> | undefined {
    if (!existsSync(this.localDataFilePath)) {
      return undefined;
    }

    try {
      const contents = readFileSync(this.localDataFilePath, 'utf-8');
      const parsed = JSON.parse(contents) as Partial<LocalSonarqubeTokenData>;
      const storedUrl =
        typeof parsed.serverUrl === 'string' ? normalizeUrl(parsed.serverUrl) : '';

      if (storedUrl && storedUrl !== normalizeUrl(hostUrl)) {
        return undefined;
      }

      return parsed;
    } catch {
      return undefined;
    }
  }

  private writeLocalData(hostUrl: string, data: Partial<LocalSonarqubeTokenData>): void {
    const current = this.readLocalData(hostUrl) ?? {};
    const merged: Partial<LocalSonarqubeTokenData> = {
      ...current,
      ...data,
      serverUrl: normalizeUrl(hostUrl),
    };

    mkdirSync(resolve(this.localDataFilePath, '..'), { recursive: true });
    writeFileSync(this.localDataFilePath, JSON.stringify(merged, null, 2), 'utf-8');
  }

  async ensurePassword(
    hostUrl: string,
    username: string,
    defaultPassword: string
  ): Promise<string> {
    const stored = this.readLocalData(hostUrl);
    if (typeof stored?.password === 'string' && stored.password.length > 0) {
      this.logger.info(`🔐 SonarQube admin and password: ${username} / ${stored.password}`);
      return stored.password;
    }

    const newPassword = `smm-${randomBytes(18).toString('base64url')}`;
    this.logger.info(`🔐 SonarQube admin and password: ${username} / ${newPassword}`);

    return this.changePassword(hostUrl, username, defaultPassword, newPassword);
  }

  async changePassword(
    hostUrl: string,
    username: string,
    previousPassword: string,
    newPassword: string
  ): Promise<string> {
    const sanitizedUrl = normalizeUrl(hostUrl);

    const response = await fetch(`${sanitizedUrl}/api/users/change_password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${username}:${previousPassword}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        login: username,
        previousPassword,
        password: newPassword,
      }).toString(),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Failed to update SonarQube admin password. ${response.status} ${response.statusText}${body ? ` - ${body}` : ''}`
      );
    }

    this.writeLocalData(sanitizedUrl, {
      username,
      password: newPassword,
      passwordUpdatedAt: new Date().toISOString(),
    });

    return newPassword;
  }

  // ── Token management ──────────────────────────────────────────────────────

  async getToken(hostUrl: string, username: string, password: string): Promise<string> {
    const cached = this.readLocalData(hostUrl);
    if (typeof cached?.token === 'string' && cached.token.length > 0) {
      return cached.token;
    }

    return this.generateToken(hostUrl, username, password);
  }

  async generateToken(hostUrl: string, username: string, password: string): Promise<string> {
    const sanitizedUrl = normalizeUrl(hostUrl);

    const response = await fetch(`${sanitizedUrl}/api/user_tokens/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
      },
      body: new URLSearchParams({ name: LOCAL_SONARQUBE_TOKEN_NAME }).toString(),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Failed to generate SonarQube token. ${response.status} ${response.statusText}${body ? ` - ${body}` : ''}`
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

    this.writeLocalData(sanitizedUrl, {
      generatedAt: new Date().toISOString(),
      token: payload.token,
      tokenName: LOCAL_SONARQUBE_TOKEN_NAME,
      login: payload.login,
    });

    return payload.token;
  }
}
