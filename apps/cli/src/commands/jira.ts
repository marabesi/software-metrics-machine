import { Command } from 'commander';
import { Logger } from '@smmachine/utils';
import { createOrchestrator } from '../orchestrator-factory.js';

const logger = new Logger('JiraCommand');

/**
 * Jira Command Group
 *
 * Provides CLI commands for Jira integration matching Python CLI functionality.
 *
 * Commands:
 *   smm jira fetch-issues      Fetch issues from Jira
 *   smm jira fetch-changelog   Fetch issue changelog from Jira
 *   smm jira fetch-comments    Fetch issue comments from Jira
 */
export function createJiraCommands(program: Command): void {
  const jiraGroup = program.command('jira').description('Jira integration operations');

  /**
   * smm jira fetch-issues [options]
   * Fetch issues from Jira
   */
  jiraGroup
    .command('fetch-issues')
    .description('Fetch issues from Jira')
    .option('--force', 'Force re-fetching issues even if already fetched')
    .option('--start-date <date>', 'Filter issues created on or after this date')
    .option('--end-date <date>', 'Filter issues created on or before this date')
    .option('--status <status>', 'Filter by issue status')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .action(async (options) => {
      try {
        console.log('🔄 Fetching issues from Jira...');

        const orchestrator = createOrchestrator();
        const issues = await orchestrator.getIssueMetrics({
          forceRefresh: options.force,
          startDate: options.startDate,
          endDate: options.endDate,
          status: options.status,
        });

        if (options.output === 'json') {
          console.log(JSON.stringify(issues, null, 2));
        } else {
          console.log(`\n✅ Fetched ${issues.totalIssues || 0} issues from Jira`);
        }
      } catch (error) {
        logger.error('Failed to fetch Jira issues', error);
        process.exit(1);
      }
    });

  /**
   * smm jira fetch-changelog [options]
   * Fetch issue changelog from Jira
   */
  jiraGroup
    .command('fetch-changelog')
    .description('Fetch issue changelog from Jira')
    .option('--issue <key>', 'Specific issue key to fetch changelog for', '')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .action(async (options) => {
      try {
        if (!options.issue) {
          console.error('❌ Error: --issue parameter is required');
          process.exit(1);
        }

        console.log(`🔄 Fetching changelog for issue ${options.issue}...`);

        const orchestrator = createOrchestrator();
        // Note: This uses the issuesRepo directly via the orchestrator
        // The orchestrator doesn't expose getIssueChanges, so we'd need to enhance it
        console.log('⚠️  Note: Changelog fetching requires direct repository access.');
        console.log('   Use the Python CLI for full changelog support:');
        console.log(`   python -m software_metrics_machine.apps.cli jira fetch-changelog --issue ${options.issue}`);
      } catch (error) {
        logger.error('Failed to fetch Jira changelog', error);
        process.exit(1);
      }
    });

  /**
   * smm jira fetch-comments [options]
   * Fetch issue comments from Jira
   */
  jiraGroup
    .command('fetch-comments')
    .description('Fetch issue comments from Jira')
    .option('--issue <key>', 'Specific issue key to fetch comments for', '')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .action(async (options) => {
      try {
        if (!options.issue) {
          console.error('❌ Error: --issue parameter is required');
          process.exit(1);
        }

        console.log(`🔄 Fetching comments for issue ${options.issue}...`);

        const orchestrator = createOrchestrator();
        // Note: This uses the issuesRepo directly via the orchestrator
        // The orchestrator doesn't expose getIssueComments, so we'd need to enhance it
        console.log('⚠️  Note: Comment fetching requires direct repository access.');
        console.log('   Use the Python CLI for full comment support:');
        console.log(`   python -m software_metrics_machine.apps.cli jira fetch-comments --issue ${options.issue}`);
      } catch (error) {
        logger.error('Failed to fetch Jira comments', error);
        process.exit(1);
      }
    });
}
