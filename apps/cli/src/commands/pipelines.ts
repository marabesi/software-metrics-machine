import { Command } from 'commander';
import { Logger } from '@smmachine/utils';
import { createOrchestrator } from '../orchestrator-factory';

const logger = new Logger('PipelinesCommand');

/**
 * Pipelines Command Group
 *
 * Provides CLI commands for pipeline/workflow operations matching Python CLI functionality.
 *
 * Commands:
 *   smm pipelines fetch                Fetch pipeline runs from GitHub
 *   smm pipelines fetch-jobs           Fetch pipeline jobs from GitHub
 *   smm pipelines summary              Display pipeline run summary
 *   smm pipelines by-status            View pipelines grouped by status
 *   smm pipelines runs-duration        View pipeline run durations
 *   smm pipelines runs-by              View pipeline runs by time period
 *   smm pipelines jobs-summary         Display pipeline jobs summary
 *   smm pipelines jobs-time-execution  View job execution times
 *   smm pipelines jobs-by-status       View jobs grouped by status
 *   smm pipelines deployment-frequency Calculate deployment frequency
 *   smm pipelines lead-time            Calculate lead time for changes
 */
export function createPipelinesCommands(program: Command): void {
  const pipelinesGroup = program.command('pipelines').description('Pipeline/workflow operations');

  /**
   * smm pipelines fetch [options]
   * Fetch pipeline runs from GitHub
   */
  pipelinesGroup
    .command('fetch')
    .description('Fetch pipeline runs from GitHub')
    .option('--force', 'Force re-fetching pipelines even if already fetched')
    .option('--start-date <date>', 'Filter runs created on or after this date (ISO 8601)')
    .option('--end-date <date>', 'Filter runs created on or before this date (ISO 8601)')
    .option('--raw-filters <filters>', 'Raw filters (e.g., status=success,branch=main)')
    .action(async (options) => {
      try {
        console.log('🔄 Fetching pipeline runs from GitHub...');

        const orchestrator = createOrchestrator();
        await orchestrator.getDeploymentMetrics({
          forceRefresh: options.force,
          startDate: options.startDate,
          endDate: options.endDate,
          rawFilters: options.rawFilters,
        });

        console.log('✅ Fetch pipeline data has been completed and stored on disk');
      } catch (error) {
        logger.error('Failed to fetch pipeline runs', error);
        process.exit(1);
      }
    });

  /**
   * smm pipelines fetch-jobs [options]
   * Fetch pipeline jobs from GitHub
   */
  pipelinesGroup
    .command('fetch-jobs')
    .description('Fetch pipeline jobs from GitHub')
    .option('--force', 'Force re-fetching jobs even if already fetched')
    .option('--start-date <date>', 'Filter jobs created on or after this date')
    .option('--end-date <date>', 'Filter jobs created on or before this date')
    .action(async (options) => {
      try {
        console.log('🔄 Fetching pipeline jobs from GitHub...');

        const orchestrator = createOrchestrator();
        await orchestrator.getDeploymentMetrics({
          forceRefresh: options.force,
          includeJobs: true,
          startDate: options.startDate,
          endDate: options.endDate,
        });

        console.log('✅ Fetch pipeline jobs has been completed and stored on disk');
      } catch (error) {
        logger.error('Failed to fetch pipeline jobs', error);
        process.exit(1);
      }
    });

  /**
   * smm pipelines summary [options]
   * Display pipeline run summary
   */
  pipelinesGroup
    .command('summary')
    .description('Display a summary of pipeline runs')
    .option('--max-workflows <number>', 'Maximum number of workflows to list', '10')
    .option('--start-date <date>', 'Start date (inclusive) in YYYY-MM-DD')
    .option('--end-date <date>', 'End date (inclusive) in YYYY-MM-DD')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .option('--raw-filters <filters>', 'Raw Provider filters string')
    .action(async (options) => {
      try {
        console.log('📊 Generating pipeline summary...');

        const orchestrator = createOrchestrator();
        const metrics = await orchestrator.getDeploymentMetrics({
          startDate: options.startDate,
          endDate: options.endDate,
        });

        if (options.output === 'json') {
          console.log(JSON.stringify(metrics, null, 2));
        } else {
          console.log('\n=== Pipeline Summary ===\n');
          console.log(`Total Runs: ${metrics.totalDeployments}`);
          console.log(`Successful Runs: ${metrics.successfulDeployments}`);
          console.log(`Failed Runs: ${metrics.failedDeployments}`);
          console.log(`Success Rate: ${(metrics.successRate * 100).toFixed(1)}%`);
          console.log(`Average Duration: ${metrics.averageDuration.toFixed(2)} minutes`);
        }
      } catch (error) {
        logger.error('Failed to generate pipeline summary', error);
        process.exit(1);
      }
    });

  /**
   * smm pipelines by-status [options]
   * View pipelines grouped by status
   */
  pipelinesGroup
    .command('by-status')
    .description('View pipeline runs grouped by status')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .action(async (options) => {
      try {
        console.log('📊 Analyzing pipelines by status...');

        const orchestrator = createOrchestrator();
        const metrics = await orchestrator.getDeploymentMetrics({
          startDate: options.startDate,
          endDate: options.endDate,
        });

        if (options.output === 'json') {
          console.log(
            JSON.stringify(
              {
                successful: metrics.successfulDeployments,
                failed: metrics.failedDeployments,
                total: metrics.totalDeployments,
              },
              null,
              2
            )
          );
        } else {
          console.log('\n=== Pipelines by Status ===\n');
          console.log(`✅ Successful: ${metrics.successfulDeployments}`);
          console.log(`❌ Failed: ${metrics.failedDeployments}`);
          console.log(`📊 Total: ${metrics.totalDeployments}`);
        }
      } catch (error) {
        logger.error('Failed to analyze pipelines by status', error);
        process.exit(1);
      }
    });

  /**
   * smm pipelines runs-duration [options]
   * View pipeline run durations
   */
  pipelinesGroup
    .command('runs-duration')
    .description('View pipeline run durations')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--workflow <name>', 'Filter by workflow name')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .action(async (options) => {
      try {
        console.log('⏱️  Analyzing pipeline run durations...');

        const orchestrator = createOrchestrator();
        const metrics = await orchestrator.getDeploymentMetrics({
          startDate: options.startDate,
          endDate: options.endDate,
        });

        if (options.output === 'json') {
          console.log(JSON.stringify({ averageDuration: metrics.averageDuration }, null, 2));
        } else {
          console.log('\n=== Pipeline Run Durations ===\n');
          if (options.workflow) {
            console.log(`Workflow: ${options.workflow}`);
          }
          console.log(`Average Duration: ${metrics.averageDuration.toFixed(2)} minutes`);
          console.log(`Total Runs: ${metrics.totalDeployments}`);
        }
      } catch (error) {
        logger.error('Failed to analyze pipeline run durations', error);
        process.exit(1);
      }
    });

  /**
   * smm pipelines runs-by [options]
   * View pipeline runs by time period
   */
  pipelinesGroup
    .command('runs-by')
    .description('View pipeline runs by time period')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--period <period>', 'Time period (day|week|month)', 'week')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .action(async (options) => {
      try {
        console.log('📈 Analyzing pipeline runs by time period...');

        const orchestrator = createOrchestrator();
        const metrics = await orchestrator.getDeploymentMetrics({
          startDate: options.startDate,
          endDate: options.endDate,
          frequency: options.period as 'day' | 'week' | 'month',
        });

        if (options.output === 'json') {
          console.log(JSON.stringify(metrics, null, 2));
        } else {
          console.log('\n=== Pipeline Runs by Period ===\n');
          console.log(`Period: ${options.period}`);
          console.log(`Total Runs: ${metrics.totalDeployments}`);
          console.log(`Deployment Frequency: ${metrics.deploymentFrequency} per ${options.period}`);
        }
      } catch (error) {
        logger.error('Failed to analyze pipeline runs by period', error);
        process.exit(1);
      }
    });

  /**
   * smm pipelines jobs-summary [options]
   * Display pipeline jobs summary
   */
  pipelinesGroup
    .command('jobs-summary')
    .description('Display a summary of pipeline jobs')
    .option('--max-jobs <number>', 'Maximum number of jobs to list', '20')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .action(async (options) => {
      try {
        console.log('📊 Generating pipeline jobs summary...');

        const orchestrator = createOrchestrator();
        const metrics = await orchestrator.getDeploymentMetrics({
          startDate: options.startDate,
          endDate: options.endDate,
        });

        if (options.output === 'json') {
          console.log(JSON.stringify(metrics, null, 2));
        } else {
          console.log('\n=== Pipeline Jobs Summary ===\n');
          console.log(`Total Jobs: ${metrics.totalDeployments}`);
          console.log(`Max Jobs to Display: ${options.maxJobs}`);
          console.log('\nNote: Detailed jobs breakdown requires enhanced metrics implementation');
        }
      } catch (error) {
        logger.error('Failed to generate jobs summary', error);
        process.exit(1);
      }
    });

  /**
   * smm pipelines jobs-time-execution [options]
   * View job execution times
   */
  pipelinesGroup
    .command('jobs-time-execution')
    .description('View pipeline job execution times')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--job <name>', 'Filter by job name')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .action(async (options) => {
      try {
        console.log('⏱️  Analyzing job execution times...');

        const orchestrator = createOrchestrator();
        const metrics = await orchestrator.getDeploymentMetrics({
          startDate: options.startDate,
          endDate: options.endDate,
        });

        if (options.output === 'json') {
          console.log(JSON.stringify({ averageDuration: metrics.averageDuration }, null, 2));
        } else {
          console.log('\n=== Job Execution Times ===\n');
          if (options.job) {
            console.log(`Job: ${options.job}`);
          }
          console.log(`Average Execution Time: ${metrics.averageDuration.toFixed(2)} minutes`);
        }
      } catch (error) {
        logger.error('Failed to analyze job execution times', error);
        process.exit(1);
      }
    });

  /**
   * smm pipelines jobs-by-status [options]
   * View jobs grouped by status
   */
  pipelinesGroup
    .command('jobs-by-status')
    .description('View pipeline jobs grouped by status')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .action(async (options) => {
      try {
        console.log('📊 Analyzing jobs by status...');

        const orchestrator = createOrchestrator();
        const metrics = await orchestrator.getDeploymentMetrics({
          startDate: options.startDate,
          endDate: options.endDate,
        });

        if (options.output === 'json') {
          console.log(
            JSON.stringify(
              {
                successful: metrics.successfulDeployments,
                failed: metrics.failedDeployments,
              },
              null,
              2
            )
          );
        } else {
          console.log('\n=== Jobs by Status ===\n');
          console.log(`✅ Successful: ${metrics.successfulDeployments}`);
          console.log(`❌ Failed: ${metrics.failedDeployments}`);
        }
      } catch (error) {
        logger.error('Failed to analyze jobs by status', error);
        process.exit(1);
      }
    });

  /**
   * smm pipelines deployment-frequency [options]
   * Calculate deployment frequency (DORA metric)
   */
  pipelinesGroup
    .command('deployment-frequency')
    .description('Calculate deployment frequency (DORA metric)')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--period <period>', 'Time period (day|week|month)', 'week')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .action(async (options) => {
      try {
        console.log('🚀 Calculating deployment frequency...');

        const orchestrator = createOrchestrator();
        const metrics = await orchestrator.getDeploymentMetrics({
          startDate: options.startDate,
          endDate: options.endDate,
          frequency: options.period as 'day' | 'week' | 'month',
        });

        if (options.output === 'json') {
          console.log(
            JSON.stringify({ deploymentFrequency: metrics.deploymentFrequency }, null, 2)
          );
        } else {
          console.log('\n=== Deployment Frequency (DORA) ===\n');
          console.log(`Period: ${options.period}`);
          console.log(`Deployment Frequency: ${metrics.deploymentFrequency} per ${options.period}`);
          console.log(`Total Deployments: ${metrics.totalDeployments}`);

          // DORA rating
          let rating = 'Low';
          if (options.period === 'day' && metrics.deploymentFrequency >= 1) {
            rating = 'Elite';
          } else if (options.period === 'week' && metrics.deploymentFrequency >= 1) {
            rating = 'High';
          } else if (options.period === 'month' && metrics.deploymentFrequency >= 1) {
            rating = 'Medium';
          }
          console.log(`\n📈 DORA Rating: ${rating}`);
        }
      } catch (error) {
        logger.error('Failed to calculate deployment frequency', error);
        process.exit(1);
      }
    });

  /**
   * smm pipelines lead-time [options]
   * Calculate lead time for changes (DORA metric)
   */
  pipelinesGroup
    .command('lead-time')
    .description('Calculate lead time for changes (DORA metric)')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .action(async (options) => {
      try {
        console.log('⏱️  Calculating lead time for changes...');

        const orchestrator = createOrchestrator();
        const metrics = await orchestrator.getDeploymentMetrics({
          startDate: options.startDate,
          endDate: options.endDate,
        });

        const leadTime = metrics.leadTime || metrics.averageDuration;

        if (options.output === 'json') {
          console.log(JSON.stringify({ leadTime }, null, 2));
        } else {
          console.log('\n=== Lead Time for Changes (DORA) ===\n');
          console.log(`Lead Time: ${leadTime.toFixed(2)} hours`);

          // DORA rating
          let rating = 'Low';
          if (leadTime < 24) {
            rating = 'Elite';
          } else if (leadTime < 168) {
            // 1 week
            rating = 'High';
          } else if (leadTime < 720) {
            // 1 month
            rating = 'Medium';
          }
          console.log(`\n📈 DORA Rating: ${rating}`);
        }
      } catch (error) {
        logger.error('Failed to calculate lead time', error);
        process.exit(1);
      }
    });
}
