import { Command } from 'commander';
import { GitFactory } from '@smmachine/core/aggregates/git-factory';
import { CodemaatFetchRepository } from '@smmachine/core/providers/codemaat/codemaat-fetch-repository';
import { CodemaatService } from '@smmachine/core/domain/code/codemaat-service';
import { Logger } from '@smmachine/utils';
import { Configuration } from '@smmachine/core/infrastructure/configuration';
import { CodemaatFactory } from '@smmachine/core/aggregates/codemaat-factory';
import { PairingFactory } from '@smmachine/core/aggregates/pairing-factory';
import path from 'path';

const logger = new Logger('CodeCommand');

function loadConfiguration(): Configuration {
  return new Configuration(process.env);
}

function createCodemaatService(): CodemaatService {
  const repository = CodemaatFactory.create(loadConfiguration());
  return new CodemaatService(repository);
}

export function createCodeCommands(program: Command): void {
  const codeGroup = program.command('code').description('Code analysis operations');

  codeGroup
    .command('summary')
    .description('View code summary with pairing insights')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--output <format>', 'Output format (text|json|csv)', 'text')
    .action(async (options) => {
      try {
        logger.info('📊 Generating code summary...');

        const pairingService = PairingFactory.create(loadConfiguration());
        const summary = await pairingService.getPairingIndex({
          startDate: options.startDate,
          endDate: options.endDate,
        });

        if (options.output === 'json') {
          logger.info(JSON.stringify(summary, null, 2));
          return;
        }

        if (options.output === 'csv') {
          const lines: string[] = ['section,metric,value'];
          lines.push(`pairing,pairing_index_percentage,${summary.pairingIndexPercentage ?? 0}`);
          lines.push(`pairing,total_analyzed_commits,${summary.totalAnalyzedCommits ?? 0}`);
          lines.push(`pairing,paired_commits,${summary.pairedCommits ?? 0}`);

          for (const pair of summary.topPairings || []) {
            lines.push(`top_pair,${pair.author} + ${pair.coAuthor},${pair.pairedCommits}`);
          }

          for (const commit of summary.latestPairedCommits || []) {
            const normalizedSubject = (commit.subject || '').replace(/,/g, ';');
            const normalizedCoAuthors = (commit.coAuthors || []).join('|').replace(/,/g, ';');
            lines.push(
              `latest_paired_commit,${commit.hash.slice(0, 8)}:${normalizedSubject},${commit.author}|${normalizedCoAuthors}`
            );
          }

          logger.info(lines.join('\n'));
          return;
        }

        logger.info('\n=== Code Summary ===\n');
        logger.info(`Pairing Index: ${summary.pairingIndexPercentage ?? 0}%`);
        logger.info(`Total Commits: ${summary.totalAnalyzedCommits ?? 0}`);
        logger.info(`Paired Commits: ${summary.pairedCommits ?? 0}`);

        if (summary.topPairings && summary.topPairings.length > 0) {
          logger.info('\nWho paired the most with whom:');
          for (const pair of summary.topPairings) {
            logger.info(`- ${pair.author} + ${pair.coAuthor}: ${pair.pairedCommits}`);
          }
        }

        if (summary.latestPairedCommits && summary.latestPairedCommits.length > 0) {
          logger.info('\nLatest 20 paired commits:');
          for (const commit of summary.latestPairedCommits) {
            const date = new Date(commit.timestamp).toISOString();
            logger.info(`- ${commit.hash.slice(0, 8)} ${date}`);
            logger.info(`  Author: ${commit.author}`);
            logger.info(`  Co-authors: ${commit.coAuthors.join(', ')}`);
            logger.info(`  Subject: ${commit.subject || '(no subject)'}`);
          }
        }

        logger.info('\n✅ Summary generated');
      } catch (error) {
        logger.error('Failed to generate code summary', error);
        process.exit(1);
      }
    });

  codeGroup
    .command('fetch-commits')
    .description('Analyze change sets from git repository')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--authors <list>', 'Comma-separated list of authors to filter')
    .option('--force', 'Force refetch commits from git and bypass cache')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .action(async (options) => {
      try {
        logger.info('🔍 Analyzing change sets...');

        const config = loadConfiguration();
        const repoPath = config.gitRepositoryLocation;

        const factory = GitFactory.create(config);

        const result = await factory.fetchCommits({
          startDate: options.startDate,
          endDate: options.endDate,
          forceRefresh: options.force,
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

        const config = loadConfiguration();
        const fetchRepository = new CodemaatFetchRepository(config);
        const result = fetchRepository.fetch({
          startDate: options.startDate,
          subfolder: options.subfolder,
          force: options.force,
          scriptPath:
            process.env.SMM_DEV_MODE === 'true'
              ? path.resolve(__dirname, '../../fetch-codemaat.sh')
              : undefined,
        });

        if (options.output === 'json') {
          logger.info(
            JSON.stringify(
              {
                repository: result.repository,
                outputDirectory: result.outputDirectory,
                stdout: result.stdout,
              },
              null,
              2
            )
          );
        } else {
          logger.info('\n=== CodeMaat Fetch ===\n');
          logger.info(`Repository: ${result.repository}`);
          logger.info(`Output Directory: ${result.outputDirectory}`);
          process.stdout.write(result.stdout);
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
        const codemaatService = createCodemaatService();
        const metrics = await codemaatService.getCodeChurn({
          startDate: options.startDate,
          endDate: options.endDate,
        });
        const churnRows = metrics.data;
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

        const codemaatService = createCodemaatService();
        const coupling = await codemaatService.getFileCoupling({
          ignorePatterns: undefined,
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

        const codemaatService = createCodemaatService();
        const metrics = await codemaatService.getCodeChurn({
          startDate: options.startDate,
          endDate: options.endDate,
        });
        const churnRows = metrics.data;
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

        const maxRows = Number(options.top);
        const codemaatService = createCodemaatService();
        const metrics = await codemaatService.getEntityEffort({
          top: Number.isFinite(maxRows) ? maxRows : undefined,
        });

        if (options.output === 'json') {
          logger.info(JSON.stringify({ entityEffort: metrics || [] }, null, 2));
        } else {
          logger.info('\n=== Entity Effort Metrics ===\n');
          logger.info(`Top Entities: ${metrics.length}`);
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

        const codemaatService = createCodemaatService();
        const metrics = await codemaatService.getEntityOwnership({
          authors: undefined,
          top: 100,
        });
        const filteredMetrics = options.entity
          ? metrics.filter((row) => row.entity.includes(options.entity))
          : metrics;

        if (options.output === 'json') {
          logger.info(JSON.stringify({ ownership: filteredMetrics }, null, 2));
        } else {
          logger.info('\n=== Entity Ownership Analysis ===\n');
          if (options.entity) {
            logger.info(`Entity: ${options.entity}`);
          }
          logger.info(`Ownership Records: ${filteredMetrics.length}`);
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

        const pairingService = PairingFactory.create(loadConfiguration());
        const pairing = await pairingService.getPairingIndex({
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
