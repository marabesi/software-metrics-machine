import { Command } from 'commander';
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { CodeMaatMetricsRepository } from '@smmachine/core/aggregates/code-metrics-repository';
import { CodemaatAnalyzer } from '@smmachine/core/providers/codemaat/codemaat-analyzer';
import { GitFactory } from '@smmachine/core/aggregates/git-factory';
import { Logger } from '@smmachine/utils';
import { CommitTraverser } from '@smmachine/core/providers/git/commit-traverser';
import { Configuration } from '@smmachine/core/infrastructure/configuration';
import { CodemaatFactory } from '@smmachine/core/aggregates/codemaat-factory';

const logger = new Logger('CodeCommand');

function loadConfiguration(): Configuration {
  return new Configuration(process.env);
}

function resolveCliRoot(): string {
  const candidates = [
    path.resolve(__dirname, '../apps/cli'),
    path.resolve(__dirname, '../../apps/cli'),
    path.resolve(__dirname, '../../../apps/cli'),
    path.resolve(__dirname, '..'),
    path.resolve(__dirname, '../..'),
    path.resolve(__dirname, '../../../../apps/cli'),
  ];

  for (const candidate of candidates) {
    const executablePath = path.join(candidate, 'fetch-codemaat.sh');
    if (fs.existsSync(executablePath)) {
      logger.debug(`Checking for fetch-codemaat.sh at: ${executablePath}`);
      return candidate;
    }
  }

  throw new Error('Could not locate fetch-codemaat.sh. Ensure CLI package includes runtime scripts.');
}

export function createCodeCommands(program: Command): void {
  const codeGroup = program.command('code').description('Code analysis operations');

  codeGroup
    .command('fetch-commits')
    .description('Analyze change sets from git repository')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--authors <list>', 'Comma-separated list of authors to filter')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .action(async (options) => {
      try {
        logger.info('🔍 Analyzing change sets...');

        const config = loadConfiguration();
        const repoPath = config.gitRepositoryLocation
        
        const factory = GitFactory.create(config)

        const result = await factory.fetchCommits({
          startDate: options.startDate,
          endDate: options.endDate,
        });
        const commits = result;

        if (options.output === 'json') {
          logger.info(JSON.stringify({ commits: commits.length }, null, 2));
        } else {
          logger.info('\n=== Change Set Analysis ===\n');
          logger.info(`Repository: ${repoPath}`);
          logger.info(`Total Commits: ${commits.length}`);
          if (options.startDate) logger.info(`Start Date: ${options.startDate}`);
          if (options.endDate) logger.info(`End Date: ${options.endDate}`);
        }
      } catch (error) {
        logger.error('Failed to analyze change sets', error);
        process.exit(1);
      }
    });

  codeGroup
    .command('codemaat-fetch')
    .description('Fetch CodeMaat CSV data from the git repository')
    .requiredOption('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--subfolder <path>', 'Subfolder within the repository to analyze', '')
    .option('--force', 'Force regeneration of CodeMaat CSV files')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .action(async (options) => {
      try {
        logger.info('🔍 Running CodeMaat analysis...');
        const cliRoot = resolveCliRoot();

        const config = loadConfiguration();
        const repoPath = config.gitRepositoryLocation
        const codemaatDir = config.getCodeMaatPath();
        const scriptPath = path.join(cliRoot, 'fetch-codemaat.sh');

        fs.mkdirSync(codemaatDir, { recursive: true });

        const stdout = execFileSync(
          'sh',
          [
            scriptPath,
            repoPath,
            codemaatDir,
            options.startDate,
            options.subfolder,
            options.force ? 'true' : 'false',
          ],
          {
            cwd: cliRoot,
            encoding: 'utf-8',
            stdio: ['ignore', 'pipe', 'pipe'],
          }
        );

        if (options.output === 'json') {
          logger.info(
            JSON.stringify(
              {
                repository: repoPath,
                outputDirectory: codemaatDir,
                stdout,
              },
              null,
              2
            )
          );
        } else {
          logger.info('\n=== CodeMaat Fetch ===\n');
          logger.info(`Repository: ${repoPath}`);
          logger.info(`Output Directory: ${codemaatDir}`);
          process.stdout.write(stdout);
        }
      } catch (error) {
        logger.error('Failed to run CodeMaat analysis', error);
        process.exit(1);
      }
    });

  codeGroup
    .command('churn')
    .description('Calculate code churn metrics')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--authors <list>', 'Comma-separated list of authors to filter')
    .option('--output <format>', 'Output format (text|json|csv)', 'text')
    .action(async (options) => {
      try {
        logger.info('📊 Calculating code churn...');
        const codemaatFactory = CodemaatFactory.create(loadConfiguration());
        const churn = createCodeDependencies(loadConfiguration());
        const metrics = await churn.codeRepository.getCodeChurn({
          selectedAuthors: options.authors
            ? options.authors.split(',').map((a: string) => a.trim())
            : undefined,
          startDate: options.startDate,
          endDate: options.endDate,
        });
        const churnRows = metrics.data
        const totalCommits = churnRows.reduce(
          (sum: number, row: any) => sum + (row.commits || 0),
          0
        );
        const linesAdded = churnRows.reduce((sum: number, row: any) => sum + (row.added || 0), 0);
        const linesRemoved = churnRows.reduce(
          (sum: number, row: any) => sum + (row.deleted || 0),
          0
        );

        if (options.output === 'json') {
          logger.info(JSON.stringify({ codeChurn: churnRows }, null, 2));
        } else {
          logger.info('\n=== Code Churn Metrics ===\n');
          logger.info(`Data Points: ${churnRows.length}`);
          logger.info(`Total Commits: ${totalCommits}`);
          logger.info(`Lines Added: ${linesAdded}`);
          logger.info(`Lines Removed: ${linesRemoved}`);
          logger.info(`Churn: ${linesAdded + linesRemoved}`);
        }
      } catch (error) {
        logger.error('Failed to calculate code churn', error);
        process.exit(1);
      }
    });

  codeGroup
    .command('coupling')
    .description('Analyze code coupling between modules')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--min-coupling <number>', 'Minimum coupling threshold', '0.3')
    .option('--output <format>', 'Output format (text|json|csv)', 'text')
    .action(async (options) => {
      try {
        logger.info('🔗 Analyzing code coupling...');

        const repository = createCodeDependencies(loadConfiguration());

        const coupling = await repository.codeRepository.getFileCoupling({
          startDate: options.startDate,
          endDate: options.endDate,
        });

        if (options.output === 'json') {
          logger.info(JSON.stringify({ coupling }, null, 2));
        } else {
          logger.info('\n=== Code Coupling Analysis ===\n');
          logger.info(`Min Coupling Threshold: ${options.minCoupling}`);
          logger.info(`Relationships: ${coupling.length}`);
        }
      } catch (error) {
        logger.error('Failed to analyze code coupling', error);
        process.exit(1);
      }
    });

  codeGroup
    .command('entity-churn')
    .description('Calculate entity-level churn metrics')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--top <number>', 'Show top N entities', '20')
    .option('--output <format>', 'Output format (text|json|csv)', 'text')
    .action(async (options) => {
      try {
        logger.info('📊 Calculating entity churn...');

        const repository = createCodeDependencies(loadConfiguration());

        const metrics = await repository.codeRepository.getCodeChurn({
          startDate: options.startDate,
          endDate: options.endDate,
        });
        const churnRows = metrics.data
        const totalChurn = churnRows.reduce(
          (sum: number, row: any) => sum + (row.added || 0) + (row.deleted || 0),
          0
        );

        if (options.output === 'json') {
          logger.info(JSON.stringify({ codeChurn: churnRows }, null, 2));
        } else {
          logger.info('\n=== Entity Churn Metrics ===\n');
          logger.info(`Top Entities: ${options.top}`);
          logger.info(`Total Churn: ${totalChurn}`);
        }
      } catch (error) {
        logger.error('Failed to calculate entity churn', error);
        process.exit(1);
      }
    });

  codeGroup
    .command('entity-effort')
    .description('Calculate entity effort metrics')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--top <number>', 'Show top N entities', '20')
    .option('--output <format>', 'Output format (text|json|csv)', 'text')
    .action(async (options) => {
      try {
        logger.info('⏱️  Calculating entity effort...');

        const repository = createCodeDependencies(loadConfiguration());
        const metrics = await repository.codeRepository.getEntityEffort({
          startDate: options.startDate,
          endDate: options.endDate,
        });

        if (options.output === 'json') {
          logger.info(JSON.stringify({ entityEffort: metrics.entityEffort || [] }, null, 2));
        } else {
          logger.info('\n=== Entity Effort Metrics ===\n');
          logger.info(`Top Entities: ${options.top}`);
          logger.info('\nNote: Detailed effort calculation requires enhanced implementation');
        }
      } catch (error) {
        logger.error('Failed to calculate entity effort', error);
        process.exit(1);
      }
    });

  codeGroup
    .command('entity-ownership')
    .description('Analyze entity ownership by developers')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--entity <path>', 'Specific entity/file to analyze')
    .option('--output <format>', 'Output format (text|json|csv)', 'text')
    .action(async (options) => {
      try {
        logger.info('👥 Analyzing entity ownership...');

        const repository = createCodeDependencies(loadConfiguration());
        const metrics = await repository.codeRepository.getEntityOwnership({
          startDate: options.startDate,
          endDate: options.endDate,
        });

        if (options.output === 'json') {
          logger.info(JSON.stringify({ ownership: metrics.ownership || {} }, null, 2));
        } else {
          logger.info('\n=== Entity Ownership Analysis ===\n');
          if (options.entity) {
            logger.info(`Entity: ${options.entity}`);
          }
          logger.info('\nNote: Detailed ownership analysis requires enhanced implementation');
        }
      } catch (error) {
        logger.error('Failed to analyze entity ownership', error);
        process.exit(1);
      }
    });

  codeGroup
    .command('pairing-index')
    .description('Calculate developer pairing index')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--min-shared <number>', 'Minimum shared commits', '2')
    .option('--output <format>', 'Output format (text|json|csv)', 'text')
    .action(async (options) => {
      try {
        logger.info('👥 Calculating developer pairing index...');

        const repository = createCodeDependencies(loadConfiguration());
        const pairing = await repository.codeRepository.getPairingIndex({
          startDate: options.startDate,
          endDate: options.endDate,
        });

        if (options.output === 'json') {
          logger.info(JSON.stringify({ pairingIndex: pairing }, null, 2));
        } else {
          logger.info('\n\n=== Developer Pairing Index ===\n');
          logger.info(`Min Shared Commits: ${options.minShared}`);
          logger.info(`Pairing Index: ${pairing.pairingIndexPercentage ?? 0}%`);
          logger.info(`Total Commits: ${pairing.totalAnalyzedCommits ?? 0}`);
          logger.info(`Paired Commits: ${pairing.pairedCommits ?? 0}`);
        }
      } catch (error) {
        logger.error('Failed to calculate pairing index', error);
        process.exit(1);
      }
    });
}
