import { Command } from 'commander';
import { createPRsCommands } from './commands/prs.js';
import { createPipelinesCommands } from './commands/pipelines.js';
import { createCodeCommands } from './commands/code.js';
import { createJiraCommands } from './commands/jira.js';
import { createSonarQubeCommands } from './commands/sonarqube.js';
import { createDashboardCommands } from './commands/dashboard.js';
import { createToolsCommands } from './commands/tools.js';
import { Logger } from '@smm/utils';
import { validateConfiguration } from './orchestrator-factory.js';

const logger = new Logger('smm-cli');

/**
 * Software Metrics Machine - CLI
 *
 * Command-line interface for metrics operations.
 * Provides commands for accessing metrics from various data sources.
 *
 * Available command groups:
 *   - smm prs           Pull request operations (fetch, analyze)
 *   - smm pipelines     Pipeline/workflow operations (fetch, analyze)
 *   - smm code          Code analysis operations (churn, coupling, etc.)
 *   - smm jira          Jira integration (fetch issues, changelog, comments)
 *   - smm sonarqube     SonarQube integration (fetch quality measures)
 *   - smm dashboard     Dashboard server operations
 *   - smm tools         Utility tools (JSON merge, etc.)
 *
 * Configuration:
 *   Set environment variables for provider configuration:
 *   - GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO
 *   - JIRA_URL, JIRA_EMAIL, JIRA_TOKEN, JIRA_PROJECT
 *   - SONARQUBE_URL, SONARQUBE_TOKEN, SONARQUBE_PROJECT
 *   - REPO_PATH
 */
async function main() {
  const program = new Command();

  program
    .name('smm')
    .description('Software Metrics Machine - High-performing team metrics')
    .version('1.0.0')
    .option('--debug', 'Enable debug logging')
    .hook('preAction', (thisCommand) => {
      const options = thisCommand.opts();
      if (options.debug || process.env.DEBUG) {
        logger.setLevel('DEBUG');
      }
    })
    .hook('preAction', () => {
      // Validate configuration before executing commands
      const validation = validateConfiguration();
      if (!validation.valid) {
        for (const error of validation.errors) {
          logger.error(error);
        }
        process.exit(1);
      }
    });

  // Register command groups
  createPRsCommands(program);
  createPipelinesCommands(program);
  createCodeCommands(program);
  createJiraCommands(program);
  createSonarQubeCommands(program);
  createDashboardCommands(program);
  createToolsCommands(program);

  // Global help
  program
    .command('help')
    .description('Show help information')
    .action(() => {
      program.outputHelp();
    });

  // Default action if no command provided
  if (!process.argv.slice(2).length) {
    program.outputHelp();
    return;
  }

  try {
    await program.parseAsync();
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`CLI Error: ${error.message}`);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
    } else {
      logger.error('Unknown CLI error');
    }
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
  if (process.env.DEBUG && error instanceof Error) {
    console.error(error.stack);
  }
  process.exit(1);
});
