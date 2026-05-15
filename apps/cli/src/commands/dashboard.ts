import { Command } from 'commander';
import { Logger } from '@smmachine/utils';
import * as fs from 'fs';
import * as path from 'path';
import { ChildProcess, spawn } from 'child_process';

const logger = new Logger('DashboardCommand');

type ServiceProcess = {
  name: string;
  process: ChildProcess;
};

function findDistRoot(): string {
  const candidates = [
    path.resolve(__dirname, '../dist'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, 'rest')) && fs.existsSync(path.join(candidate, 'webapp'))) {
      return candidate;
    }
  }

  throw new Error(
    `Could not locate bundled services. Expected rest and webapp folders under one of: ${candidates.join(', ')}`,
  );
}

function resolveWebappEntry(webappDistDir: string): string {
  const candidates = [
    path.join(webappDistDir, 'standalone', 'apps', 'webapp', 'server.js'),
    // path.join(webappDistDir, 'server.js'),
    // path.join(webappDistDir, '.next', 'standalone', 'server.js'),
  ];

  for (const entry of candidates) {
    if (fs.existsSync(entry)) {
      return entry;
    }
  }

  throw new Error(
    `Could not find webapp server entrypoint. Expected one of: ${candidates.join(', ')}`,
  );
}

function spawnService(
  name: string,
  scriptPath: string,
  cwd: string,
  env: NodeJS.ProcessEnv,
): ChildProcess {
  const child = spawn(process.execPath, [scriptPath], {
    cwd,
    env,
    stdio: 'inherit',
  });

  child.on('error', (error) => {
    logger.error(`Failed to start ${name}`, error);
  });

  return child;
}

function terminateServices(services: ServiceProcess[]): void {
  for (const service of services) {
    if (!service.process.killed) {
      service.process.kill('SIGTERM');
    }
  }
}

/**
 * Dashboard Command Group
 *
 * Provides CLI commands for dashboard operations matching Python CLI functionality.
 *
 * Commands:
 *   smm dashboard serve    Start the dashboard server
 */
export function createDashboardCommands(program: Command): void {
  const dashboardGroup = program.command('dashboard').description('Dashboard operations');

  /**
   * smm dashboard serve [options]
   * Start the dashboard server
   */
  dashboardGroup
    .command('serve')
    .description('Start bundled REST API and dashboard webapp servers')
    .option('--webapp-port <number>', 'Port to run the webapp server on', '3000')
    .option('--rest-port <number>', 'Port to run the REST API server on', '3001')
    .option('--host <host>', 'Host to bind the server to', 'localhost')
    .action(async (options) => {
      try {
        const webPort = String(options.webappPort);
        const restPort = String(options.restPort);
        const host = String(options.host);

        const distRoot = findDistRoot();
        // const restEntry = path.join(distRoot, 'rest', 'dist', 'main.js');
        const webappDistDir = path.join(distRoot, 'webapp');
        const webappEntry = resolveWebappEntry(webappDistDir);

        // if (!fs.existsSync(restEntry)) {
        //   throw new Error(`Could not find REST entrypoint at ${restEntry}`);
        // }

        console.log('🚀 Starting bundled dashboard services...');
        console.log(`   Host: ${options.host}`);
        console.log(`   REST API: http://${host}:${restPort}`);
        console.log(`   Webapp: http://${host}:${webPort}`);

        const services: ServiceProcess[] = [];
        const commonEnv = { ...process.env };

        // const restProcess = spawnService('rest', restEntry, path.dirname(restEntry), {
        //   ...commonEnv,
        //   HOST: host,
        //   PORT: restPort,
        // });
        // services.push({ name: 'rest', process: restProcess });

        const webappProcess = spawnService('webapp', webappEntry, path.dirname(webappEntry), {
          ...commonEnv,
          HOST: host,
          HOSTNAME: host,
          PORT: webPort,
          REST_PORT: restPort,
          SMM_REST_BASE_URL: process.env.SMM_REST_BASE_URL || `http://${host}:${restPort}`,
          NODE_ENV: process.env.NODE_ENV || 'production',
        });
        services.push({ name: 'webapp', process: webappProcess });

        for (const service of services) {
          service.process.on('exit', (code, signal) => {
            logger.info(`${service.name} exited with code=${code ?? 'null'} signal=${signal ?? 'null'}`);
            terminateServices(services);
          });
        }

        const shutdown = () => {
          logger.info('Stopping dashboard services...');
          terminateServices(services);
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
      } catch (error) {
        logger.error('Failed to start dashboard', error);
        process.exit(1);
      }
    });
}
