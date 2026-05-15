import { Command } from 'commander';
import { createPRsCommands } from './commands/prs';
import { createPipelinesCommands } from './commands/pipelines';
import { createCodeCommands } from './commands/code';
import { createJiraCommands } from './commands/jira';
import { createSonarQubeCommands } from './commands/sonarqube';
import { createDashboardCommands } from './commands/dashboard';
import { createToolsCommands } from './commands/tools';
import { Logger } from '@smmachine/utils';
import { validateConfiguration } from './orchestrator-factory';

const logger = new Logger('smm-cli');

export function commands() {
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
  return program;
}

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
 *   Set SMM_STORE_DATA_AT environment variable to point to a JSON configuration file:
 *   
 *   export SMM_STORE_DATA_AT=/path/to/config.json
 *   
 *   JSON configuration format:
 *   {
 *     "git_provider": "github",
 *     "github_token": "your_token",
 *     "github_repository": "owner/repo",
 *     "git_repository_location": "/path/to/repo",
 *     "deployment_frequency_target_pipeline": ".github/workflows/ci.yml",
 *     "deployment_frequency_target_job": "delivery",
 *     "main_branch": "main",
 *     "jira_url": "https://your-org.atlassian.net",
 *     "jira_token": "your_token",
 *     "jira_project": "PROJECT",
 *     "jira_email": "your@email.com",
 *     "sonar_url": "https://sonarcloud.io",
 *     "sonar_token": "your_token",
 *     "sonar_project": "project_key",
 *     "log_level": "INFO",
 *     "dashboard_start_date": "2024-01-01",
 *     "dashboard_end_date": "2024-12-31"
 *   }
 *   
 *   Alternatively, you can use individual environment variables:
 *   GITHUB_TOKEN, GITHUB_REPOSITORY, GIT_REPOSITORY_LOCATION,
 *   JIRA_URL, JIRA_EMAIL, JIRA_TOKEN, JIRA_PROJECT,
 *   SONAR_URL, SONAR_TOKEN, SONAR_PROJECT
 */
export async function main() {
  const program = commands();

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
