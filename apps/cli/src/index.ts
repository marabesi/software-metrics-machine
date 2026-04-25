import { Command } from 'commander';
import { createMetricsCommands } from './commands/metrics.js';
import { Logger } from '@smm/utils';
import { validateConfiguration } from './orchestrator-factory.js';

const logger = new Logger('smm-cli');

/**
 * Software Metrics Machine - CLI
 *
 * Command-line interface for metrics operations.
 * Provides commands for accessing metrics from various data sources.
 *
 * Available commands:
 *   - smm metrics pr        Get pull request metrics
 *   - smm metrics deployment Get deployment metrics
 *   - smm metrics code      Get code metrics
 *   - smm metrics issues    Get issue metrics
 *   - smm metrics quality   Get quality metrics
 *   - smm metrics report    Get complete report
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

  // Register metrics command group
  createMetricsCommands(program);

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
