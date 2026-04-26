import { Command } from 'commander';
import { Logger } from '@smm/utils';
import {
  JiraIssuesClient,
  IssuesRepository,
  Configuration,
} from '@smm/core';
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
    .option('--project <key>', 'Jira project key')
    .option('--jql <query>', 'JQL query to filter issues')
    .option('--max-results <number>', 'Maximum number of results', '100')
    .option('--force', 'Force re-fetching issues even if already fetched')
    .option('--start-date <date>', 'Filter issues created on or after this date')
    .option('--end-date <date>', 'Filter issues created on or before this date')
    .action(async (options) => {
      try {
        console.log('🔄 Fetching issues from Jira...');

        const orchestrator = createOrchestrator();
        const config = orchestrator.getConfiguration();
        const repository = new IssuesRepository(config.storeData || './outputs');
        const client = new JiraIssuesClient(
          config.jiraUrl || '',
          config.jiraToken || '',
          config.jiraProject || options.project || '',
          repository
        );

        await client.fetchIssues({
          jql: options.jql,
          maxResults: parseInt(options.maxResults),
          force: options.force,
          startDate: options.startDate,
          endDate: options.endDate,
        });

        console.log('✅ Fetch issues has been completed');
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
    .option('--project <key>', 'Jira project key')
    .option('--issue <key>', 'Specific issue key to fetch changelog for')
    .option('--force', 'Force re-fetching changelog even if already fetched')
    .option('--start-date <date>', 'Filter changelog entries after this date')
    .option('--end-date <date>', 'Filter changelog entries before this date')
    .action(async (options) => {
      try {
        console.log('🔄 Fetching issue changelog from Jira...');

        const orchestrator = createOrchestrator();
        const config = orchestrator.getConfiguration();
        const repository = new IssuesRepository(config.storeData || './outputs');
        const client = new JiraIssuesClient(
          config.jiraUrl || '',
          config.jiraToken || '',
          config.jiraProject || options.project || '',
          repository
        );

        await client.fetchChangelog({
          issueKey: options.issue,
          force: options.force,
          startDate: options.startDate,
          endDate: options.endDate,
        });

        console.log('✅ Fetch changelog has been completed');
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
    .option('--project <key>', 'Jira project key')
    .option('--issue <key>', 'Specific issue key to fetch comments for')
    .option('--force', 'Force re-fetching comments even if already fetched')
    .option('--start-date <date>', 'Filter comments created after this date')
    .option('--end-date <date>', 'Filter comments created before this date')
    .action(async (options) => {
      try {
        console.log('🔄 Fetching issue comments from Jira...');

        const orchestrator = createOrchestrator();
        const config = orchestrator.getConfiguration();
        const repository = new IssuesRepository(config.storeData || './outputs');
        const client = new JiraIssuesClient(
          config.jiraUrl || '',
          config.jiraToken || '',
          config.jiraProject || options.project || '',
          repository
        );

        await client.fetchComments({
          issueKey: options.issue,
          force: options.force,
          startDate: options.startDate,
          endDate: options.endDate,
        });

        console.log('✅ Fetch comments has been completed');
      } catch (error) {
        logger.error('Failed to fetch Jira comments', error);
        process.exit(1);
      }
    });
}
