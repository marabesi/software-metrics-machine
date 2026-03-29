import { Command } from 'commander';
import { Logger } from '@smm/utils';
import {
  formatPullRequestMetrics,
  formatDeploymentMetrics,
  formatCodeMetrics,
  formatIssueMetrics,
  formatQualityMetrics,
  formatCompleteReport,
  formatError,
  formatLoading,
} from '../formatters';
import { createOrchestrator } from '../orchestrator-factory';

const logger = new Logger('MetricsCommand');

/**
 * Metrics Command Group
 *
 * Provides CLI commands for all metrics operations.
 * Commands delegate to MetricsOrchestrator for business logic.
 *
 * Usage:
 *   smm metrics pr [options]
 *   smm metrics deployment [options]
 *   smm metrics code [options]
 *   smm metrics issues [options]
 *   smm metrics quality [options]
 *   smm metrics report [options]
 */
export function createMetricsCommands(program: Command): void {
  const metricsGroup = program.command('metrics').description('Metrics operations');

  /**
   * smm metrics pr [options]
   * Get pull request metrics
   */
  metricsGroup
    .command('pr')
    .description('Get pull request metrics')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--format <format>', 'Output format (json|text|csv)', 'text')
    .option('--verbose', 'Show verbose output')
    .action(async (options) => {
      try {
        console.log(formatLoading('Fetching pull request metrics...'));

        const orchestrator = createOrchestrator();
        const metrics = await orchestrator.getPRMetrics({
          startDate: options.startDate,
          endDate: options.endDate,
        });

        const output = formatPullRequestMetrics(metrics, {
          format: options.format,
          verbose: options.verbose,
        });
        console.log(output);
      } catch (error) {
        console.error(formatError(error as Error, { verbose: options.verbose }));
        process.exit(1);
      }
    });

  /**
   * smm metrics deployment [options]
   * Get deployment metrics
   */
  metricsGroup
    .command('deployment')
    .description('Get deployment metrics')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--frequency <freq>', 'Frequency (day|week|month)', 'week')
    .option('--format <format>', 'Output format (json|text|csv)', 'text')
    .option('--verbose', 'Show verbose output')
    .action(async (options) => {
      try {
        console.log(formatLoading('Fetching deployment metrics...'));

        const orchestrator = createOrchestrator();
        const metrics = await orchestrator.getDeploymentMetrics({
          startDate: options.startDate,
          endDate: options.endDate,
          frequency: options.frequency as 'day' | 'week' | 'month',
        });

        const output = formatDeploymentMetrics(metrics, {
          format: options.format,
          verbose: options.verbose,
        });
        console.log(output);
      } catch (error) {
        console.error(formatError(error as Error, { verbose: options.verbose }));
        process.exit(1);
      }
    });

  /**
   * smm metrics code [options]
   * Get code metrics
   */
  metricsGroup
    .command('code')
    .description('Get code metrics')
    .option('--authors <list>', 'Filter by authors (comma-separated)')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--format <format>', 'Output format (json|text|csv)', 'text')
    .option('--verbose', 'Show verbose output')
    .action(async (options) => {
      try {
        console.log(formatLoading('Fetching code metrics...'));

        const orchestrator = createOrchestrator();
        const selectedAuthors = options.authors ? options.authors.split(',').map((a: string) => a.trim()) : undefined;

        const metrics = await orchestrator.getCodeMetrics({
          selectedAuthors,
          startDate: options.startDate,
          endDate: options.endDate,
        });

        const output = formatCodeMetrics(metrics, {
          format: options.format,
          verbose: options.verbose,
        });
        console.log(output);
      } catch (error) {
        console.error(formatError(error as Error, { verbose: options.verbose }));
        process.exit(1);
      }
    });

  /**
   * smm metrics issues [options]
   * Get issue metrics
   */
  metricsGroup
    .command('issues')
    .description('Get issue metrics')
    .option('--status <status>', 'Filter by status')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--format <format>', 'Output format (json|text|csv)', 'text')
    .option('--verbose', 'Show verbose output')
    .action(async (options) => {
      try {
        console.log(formatLoading('Fetching issue metrics...'));

        const orchestrator = createOrchestrator();
        const metrics = await orchestrator.getIssueMetrics({
          status: options.status,
          startDate: options.startDate,
          endDate: options.endDate,
        });

        const output = formatIssueMetrics(metrics, {
          format: options.format,
          verbose: options.verbose,
        });
        console.log(output);
      } catch (error) {
        console.error(formatError(error as Error, { verbose: options.verbose }));
        process.exit(1);
      }
    });

  /**
   * smm metrics quality [options]
   * Get quality metrics
   */
  metricsGroup
    .command('quality')
    .description('Get quality metrics')
    .option('--measures <list>', 'Specific measures (comma-separated)')
    .option('--format <format>', 'Output format (json|text|csv)', 'text')
    .option('--verbose', 'Show verbose output')
    .action(async (options) => {
      try {
        console.log(formatLoading('Fetching quality metrics...'));

        const orchestrator = createOrchestrator();
        const measures = options.measures ? options.measures.split(',').map((m: string) => m.trim()) : undefined;

        const metrics = await orchestrator.getQualityMetrics(measures);

        const output = formatQualityMetrics(metrics, {
          format: options.format,
          verbose: options.verbose,
        });
        console.log(output);
      } catch (error) {
        console.error(formatError(error as Error, { verbose: options.verbose }));
        process.exit(1);
      }
    });

  /**
   * smm metrics report [options]
   * Get complete metrics report
   */
  metricsGroup
    .command('report')
    .description('Get complete metrics report')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--authors <list>', 'Filter by authors (comma-separated)')
    .option('--status <status>', 'Filter by issue status')
    .option('--format <format>', 'Output format (json|text|csv)', 'text')
    .option('--verbose', 'Show verbose output')
    .action(async (options) => {
      try {
        console.log(formatLoading('Generating complete metrics report...'));

        const orchestrator = createOrchestrator();
        const selectedAuthors = options.authors ? options.authors.split(',').map((a: string) => a.trim()) : undefined;

        const report = await orchestrator.getFullReport({
          startDate: options.startDate,
          endDate: options.endDate,
          selectedAuthors,
          status: options.status,
        });

        const output = formatCompleteReport(report, {
          format: options.format,
          verbose: options.verbose,
        });
        console.log(output);
      } catch (error) {
        console.error(formatError(error as Error, { verbose: options.verbose }));
        process.exit(1);
      }
    });
}
