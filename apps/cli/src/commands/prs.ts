import { Command } from 'commander';
import { Logger } from '@smmachine/utils';
import { createOrchestrator } from '../orchestrator-factory.js';

const logger = new Logger('PRsCommand');

/**
 * PRs Command Group
 *
 * Provides CLI commands for pull request operations matching Python CLI functionality.
 *
 * Commands:
 *   smm prs fetch       Fetch pull requests from GitHub
 *   smm prs summary     View PR summary statistics
 *   smm prs by-month    View PR metrics by month
 *   smm prs by-week     View PR metrics by week
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
    .action(async (options) => {
      try {
        console.log('🔄 Fetching pull requests from GitHub...');

        const orchestrator = createOrchestrator();
        // Call getPRMetrics which internally calls refreshPRs
        await orchestrator.getPRMetrics({
          startDate: options.startDate,
          endDate: options.endDate,
          forceRefresh: options.force,
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

        const orchestrator = createOrchestrator();
        const summary = await orchestrator.getPRMetrics({
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

  /**
   * smm prs by-month [options]
   * View PR metrics grouped by month
   */
  prsGroup
    .command('by-month')
    .description('View PR metrics grouped by month')
    .option('--start-date <date>', 'Filter PRs created on or after this date')
    .option('--end-date <date>', 'Filter PRs created on or before this date')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .action(async (options) => {
      try {
        console.log('📊 Analyzing PRs by month...');

        const orchestrator = createOrchestrator();
        const metrics = await orchestrator.getPRMetrics({
          startDate: options.startDate,
          endDate: options.endDate,
        });

        if (options.output === 'json') {
          console.log(JSON.stringify(metrics, null, 2));
        } else {
          console.log('\n=== PRs by Month ===\n');
          console.log(JSON.stringify(metrics, null, 2));
        }

        console.log('\n✅ Analysis completed');
      } catch (error) {
        logger.error('Failed to analyze PRs by month', error);
        process.exit(1);
      }
    });

  /**
   * smm prs by-week [options]
   * View PR metrics grouped by week
   */
  prsGroup
    .command('by-week')
    .description('View PR metrics grouped by week')
    .option('--start-date <date>', 'Filter PRs created on or after this date')
    .option('--end-date <date>', 'Filter PRs created on or before this date')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .action(async (options) => {
      try {
        console.log('📊 Analyzing PRs by week...');

        const orchestrator = createOrchestrator();
        const metrics = await orchestrator.getPRMetrics({
          startDate: options.startDate,
          endDate: options.endDate,
        });

        if (options.output === 'json') {
          console.log(JSON.stringify(metrics, null, 2));
        } else {
          console.log('\n=== PRs by Week ===\n');
          console.log(JSON.stringify(metrics, null, 2));
        }

        console.log('\n✅ Analysis completed');
      } catch (error) {
        logger.error('Failed to analyze PRs by week', error);
        process.exit(1);
      }
    });
}
