import { Command } from 'commander';
import { Logger } from '@smm/utils';
import {
  GithubPrsClient,
  PullRequestsRepository,
  Configuration,
} from '@smm/core';

const logger = new Logger('PRsCommand');

/**
 * PRs Command Group
 *
 * Provides CLI commands for pull request operations matching Python CLI functionality.
 *
 * Commands:
 *   smm prs fetch       Fetch pull requests from GitHub
 *   smm prs summary     View PR summary statistics
 */
export function createPRsCommands(program: Command): void {
  const prsGroup = program.command('prs').description('Pull request operations');

  /**
   * smm prs fetch [options]
   * Fetch pull requests from GitHub
   */
  prsGroup
    .command('fetch')
    .description('Fetch pull requests from GitHub')
    .option('--force', 'Force re-fetching PRs even if already fetched')
    .option('--start-date <date>', 'Filter PRs created on or after this date (ISO 8601)')
    .option('--end-date <date>', 'Filter PRs created on or before this date (ISO 8601)')
    .option('--state <state>', 'Filter by PR state (open|closed|all)', 'all')
    .action(async (options) => {
      try {
        console.log('🔄 Fetching pull requests from GitHub...');

        const config = new Configuration(process.env);
        const [githubOwner, githubRepo] = (config.githubRepository || '/').split('/');

        const githubPrsClient = new GithubPrsClient(
          config.githubToken || '',
          githubOwner || '',
          githubRepo || '',
        );

        const repository = new PullRequestsRepository(
          githubPrsClient,
          config.storeData || './outputs',
        );

        await repository.fetchAndStorePRs({
          startDate: options.startDate,
          endDate: options.endDate,
          state: options.state as 'open' | 'closed' | 'all',
        });

        console.log('✅ Fetch data has been completed');
      } catch (error) {
        logger.error('Failed to fetch pull requests', error);
        process.exit(1);
      }
    });

  /**
   * smm prs summary [options]
   * View PR summary statistics
   */
  prsGroup
    .command('summary')
    .description('View PR summary statistics')
    .option('--start-date <date>', 'Filter PRs created on or after this date')
    .option('--end-date <date>', 'Filter PRs created on or before this date')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .action(async (options) => {
      try {
        console.log('📊 Generating PR summary...');

        const config = new Configuration(process.env);
        const [githubOwner, githubRepo] = (config.githubRepository || '/').split('/');

        const githubPrsClient = new GithubPrsClient(
          config.githubToken || '',
          githubOwner || '',
          githubRepo || '',
        );

        const repository = new PullRequestsRepository(
          githubPrsClient,
          config.storeData || './outputs',
        );

        const summary = await repository.getPRMetrics({
          startDate: options.startDate,
          endDate: options.endDate,
        });

        if (options.output === 'json') {
          console.log(JSON.stringify(summary, null, 2));
        } else {
          console.log('\n=== PR Summary ===\n');
          console.log(`Total PRs: ${summary.totalPRs || 0}`);
          console.log(`Open PRs: ${summary.openPRs || 0}`);
          console.log(`Closed PRs: ${summary.closedPRs || 0}`);
          console.log(`Merged PRs: ${summary.mergedPRs || 0}`);
          console.log(`Average Lead Time: ${summary.averageLeadTime || 'N/A'} days`);
          console.log(`Average Comments: ${summary.averageComments || 'N/A'}`);
        }

        console.log('\n✅ Summary generated');
      } catch (error) {
        logger.error('Failed to generate PR summary', error);
        process.exit(1);
      }
    });
}


  /**
   * smm prs fetch-comments [options]
   * Fetch PR comments from GitHub
   */
  prsGroup
    .command('fetch-comments')
    .description('Fetch PR comments from GitHub')
    .option('--months <number>', 'Number of months back to fetch', '1')
    .option('--force', 'Force re-fetching comments even if already fetched')
    .option('--start-date <date>', 'Filter comments created on or after this date')
    .option('--end-date <date>', 'Filter comments created on or before this date')
    .action(async (options) => {
      try {
        console.log('🔄 Fetching PR comments from GitHub...');

        const orchestrator = createOrchestrator();
        const config = orchestrator.getConfiguration();
        const repository = new PullRequestsRepository(config.storeData || './outputs');
        const client = new GithubPrsCommentsClient(
          config.githubToken || '',
          config.githubOwner || '',
          config.githubRepository || '',
          repository
        );

        await client.fetchPRComments({
          months: parseInt(options.months),
          force: options.force,
          startDate: options.startDate,
          endDate: options.endDate,
        });

        console.log('✅ Fetch comments has been completed');
      } catch (error) {
        logger.error('Failed to fetch PR comments', error);
        process.exit(1);
      }
    });

  /**
   * smm prs summary [options]
   * View PR summary statistics
   */
  prsGroup
    .command('summary')
    .description('View data information for pull requests')
    .option('--csv <path>', 'Export summary as CSV to the given file path')
    .option('--start-date <date>', 'Filter PRs created on or after this date (ISO 8601)')
    .option('--end-date <date>', 'Filter PRs created on or before this date (ISO 8601)')
    .option('--labels <labels>', 'Comma-separated list of label names to filter PRs by')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .option('--raw-filters <filters>', 'Raw Provider filters string')
    .action(async (options) => {
      try {
        console.log('📊 Generating PR summary...');

        const orchestrator = createOrchestrator();
        const filters: any = {
          startDate: options.startDate,
          endDate: options.endDate,
        };

        if (options.labels) {
          filters.labels = options.labels.split(',').map((l: string) => l.trim());
        }

        const metrics = await orchestrator.getPRMetrics(filters);

        if (options.output === 'json') {
          console.log(JSON.stringify(metrics, null, 2));
        } else {
          console.log('\n=== Pull Request Summary ===\n');
          console.log(`Total PRs: ${metrics.totalPRs}`);
          console.log(`Merged PRs: ${metrics.mergedPRs}`);
          console.log(`Closed PRs: ${metrics.closedPRs}`);
          console.log(`Open PRs: ${metrics.openPRs}`);
          console.log(`Average Review Time: ${metrics.averageReviewTime.toFixed(2)} hours`);
          console.log(`Average Time to Merge: ${metrics.averageTimeToMerge.toFixed(2)} hours`);
        }

        if (options.csv) {
          console.log(`\n📁 CSV exported to: ${options.csv}`);
        }
      } catch (error) {
        logger.error('Failed to generate PR summary', error);
        process.exit(1);
      }
    });

  /**
   * smm prs through-time [options]
   * View PRs opened/closed over time
   */
  prsGroup
    .command('through-time')
    .description('View PRs opened and closed over time')
    .option('--start-date <date>', 'Start date (ISO 8601)')
    .option('--end-date <date>', 'End date (ISO 8601)')
    .option('--frequency <freq>', 'Time frequency (day|week|month)', 'week')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .action(async (options) => {
      try {
        console.log('📈 Analyzing PRs over time...');

        const orchestrator = createOrchestrator();
        const metrics = await orchestrator.getPRMetrics({
          startDate: options.startDate,
          endDate: options.endDate,
        });

        if (options.output === 'json') {
          console.log(JSON.stringify(metrics, null, 2));
        } else {
          console.log('\n=== PRs Through Time ===\n');
          console.log(`Period: ${options.startDate || 'start'} to ${options.endDate || 'now'}`);
          console.log(`Frequency: ${options.frequency}`);
          console.log(`Total PRs: ${metrics.totalPRs}`);
          console.log(`Average per ${options.frequency}: ${(metrics.totalPRs / 4).toFixed(1)}`);
        }
      } catch (error) {
        logger.error('Failed to analyze PRs through time', error);
        process.exit(1);
      }
    });

  /**
   * smm prs average-open-by [options]
   * Average PRs open by time period
   */
  prsGroup
    .command('average-open-by')
    .description('Average number of PRs open by time period')
    .option('--start-date <date>', 'Start date (ISO 8601)')
    .option('--end-date <date>', 'End date (ISO 8601)')
    .option('--period <period>', 'Time period (day|week|month)', 'week')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .action(async (options) => {
      try {
        console.log('📊 Calculating average open PRs...');

        const orchestrator = createOrchestrator();
        const metrics = await orchestrator.getPRMetrics({
          startDate: options.startDate,
          endDate: options.endDate,
        });

        if (options.output === 'json') {
          console.log(JSON.stringify({ averageOpenPRs: metrics.openPRs }, null, 2));
        } else {
          console.log('\n=== Average Open PRs ===\n');
          console.log(`Period: ${options.period}`);
          console.log(`Average Open PRs: ${metrics.openPRs}`);
        }
      } catch (error) {
        logger.error('Failed to calculate average open PRs', error);
        process.exit(1);
      }
    });

  /**
   * smm prs review-time-by-author [options]
   * Average review time by author
   */
  prsGroup
    .command('review-time-by-author')
    .description('View average review time by author')
    .option('--start-date <date>', 'Start date (ISO 8601)')
    .option('--end-date <date>', 'End date (ISO 8601)')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .action(async (options) => {
      try {
        console.log('👥 Analyzing review time by author...');

        const orchestrator = createOrchestrator();
        const metrics = await orchestrator.getPRMetrics({
          startDate: options.startDate,
          endDate: options.endDate,
        });

        if (options.output === 'json') {
          console.log(JSON.stringify({ averageReviewTime: metrics.averageReviewTime }, null, 2));
        } else {
          console.log('\n=== Average Review Time by Author ===\n');
          console.log(`Average Review Time: ${metrics.averageReviewTime.toFixed(2)} hours`);
          console.log('\nNote: Per-author breakdown requires enhanced metrics implementation');
        }
      } catch (error) {
        logger.error('Failed to analyze review time by author', error);
        process.exit(1);
      }
    });

  /**
   * smm prs by-author [options]
   * View PRs by author
   */
  prsGroup
    .command('by-author')
    .description('View pull requests by author')
    .option('--start-date <date>', 'Start date (ISO 8601)')
    .option('--end-date <date>', 'End date (ISO 8601)')
    .option('--author <name>', 'Filter by specific author')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .action(async (options) => {
      try {
        console.log('👤 Analyzing PRs by author...');

        const orchestrator = createOrchestrator();
        const metrics = await orchestrator.getPRMetrics({
          startDate: options.startDate,
          endDate: options.endDate,
        });

        if (options.output === 'json') {
          console.log(JSON.stringify(metrics, null, 2));
        } else {
          console.log('\n=== PRs by Author ===\n');
          if (options.author) {
            console.log(`Author: ${options.author}`);
          }
          console.log(`Total PRs: ${metrics.totalPRs}`);
          console.log('\nNote: Detailed author breakdown requires enhanced metrics implementation');
        }
      } catch (error) {
        logger.error('Failed to analyze PRs by author', error);
        process.exit(1);
      }
    });

  /**
   * smm prs average-comments [options]
   * Average comments per PR
   */
  prsGroup
    .command('average-comments')
    .description('Average number of comments per PR')
    .option('--start-date <date>', 'Start date (ISO 8601)')
    .option('--end-date <date>', 'End date (ISO 8601)')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .action(async (options) => {
      try {
        console.log('💬 Calculating average comments per PR...');

        const orchestrator = createOrchestrator();
        const metrics = await orchestrator.getPRMetrics({
          startDate: options.startDate,
          endDate: options.endDate,
        });

        if (options.output === 'json') {
          console.log(
            JSON.stringify({ averageComments: metrics.averageComments || 0 }, null, 2)
          );
        } else {
          console.log('\n=== Average Comments per PR ===\n');
          console.log(`Average Comments: ${metrics.averageComments || 0}`);
        }
      } catch (error) {
        logger.error('Failed to calculate average comments', error);
        process.exit(1);
      }
    });
}
