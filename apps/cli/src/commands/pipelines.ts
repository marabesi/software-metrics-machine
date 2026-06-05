import {Command} from 'commander';
import {Configuration} from '@smmachine/core/infrastructure/configuration';
import {Logger} from '@smmachine/utils';
import { PipelinesService } from "@smmachine/core";
import PipelineFactory from "@smmachine/core/aggregates/pipeline-factory";

const logger = new Logger('PipelinesCommand');

const config = new Configuration(process.env);

const { pipelineRepository, workflowRepository, workflowJobRepository}  = PipelineFactory.create(config)

const pipelineService = new PipelinesService(pipelineRepository)

export function createPipelinesCommands(program: Command): void {
  const pipelinesGroup = program.command('pipelines').description('Pipeline/workflow operations');

  pipelinesGroup
    .command('fetch')
    .description('Fetch pipeline runs from GitHub')
    .option('--force', 'Force re-fetching pipelines even if already fetched', false)
    .option('--update', 'Incrementally update pipelines — fetch only newer items and merge with existing cache')
    .option('--start-date <date>', 'Filter runs created on or after this date (ISO 8601)')
    .option('--end-date <date>', 'Filter runs created on or before this date (ISO 8601)')
    .option('--raw-filters <filters>', 'Raw filters (e.g., status=success,branch=main)')
    .option('--by-day', 'Fetch workflows day by day instead of all at once', false)
    .action(async (options) => {
      try {
        logger.info('🔄 Fetching pipeline runs from GitHub...');

        await workflowRepository.fetchPipelines({
          forceRefresh: options.force,
          startDate: options.startDate,
          endDate: options.endDate,
          rawFilters: options.rawFilters,
          byDay: options.byDay,
          incrementalUpdate: options.update,
        });

        logger.info('✅ Fetch pipeline data has been completed and stored on disk');
      } catch (error) {
        logger.error('Failed to fetch pipeline runs', error);
        process.exit(1);
      }
    });

  pipelinesGroup
    .command('fetch-jobs')
    .description('Fetch pipeline jobs from GitHub')
    .option('--force', 'Force re-fetching jobs even if already fetched')
    .option('--update', 'Incrementally update jobs — fetch only newer items and merge with existing cache')
    .option('--run-start-date <date>', 'Filter pipelines created on or after this date')
    .option('--run-end-date <date>', 'Filter pipelines created on or before this date')
    .option('--raw-filters <filters>', 'Raw filters (e.g., status=success,branch=main)')
    .option('--by-day', 'Fetch jobs day by day instead of all at once', false)
    .action(async (options) => {
      try {
        logger.info('🔄 Fetching pipeline jobs from GitHub...');

        await workflowJobRepository.fetchJobs({
          forceRefresh: options.force,
          startDate: options.runStartDate,
          endDate: options.runEndDate,
          rawFilters: options.rawFilters,
          byDay: options.byDay,
          incrementalUpdate: options.update,
        });

        console.log('✅ Fetch pipeline jobs has been completed and stored on disk');
      } catch (error) {
        logger.error('Failed to fetch pipeline jobs', error);
        process.exit(1);
      }
    });

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

        const metrics = await pipelineService.getMetrics({
          startDate: options.startDate,
          endDate: options.endDate,
        });

        if (options.output === 'json') {
          console.log(JSON.stringify(metrics, null, 2));
        } else {
          console.log('\n=== Pipeline Summary ===\n');
          console.log(`Total Runs: ${metrics.totalRuns}`);
          console.log(`Successful Runs: ${metrics.successfulRuns}`);
          console.log(`Failed Runs: ${metrics.failedRuns}`);
          console.log(`Success Rate: ${(metrics.successRate * 100).toFixed(1)}%`);
          console.log(`Average Duration: ${metrics.averageDurationMinutes.toFixed(2)} minutes`);
        }
      } catch (error) {
        logger.error('Failed to generate pipeline summary', error);
        process.exit(1);
      }
    });

  pipelinesGroup
    .command('by-status')
    .description('View pipeline runs grouped by status')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--output <format>', 'Output format (text|json)', 'text')
    .action(async (options) => {
      try {
        console.log('📊 Analyzing pipelines by status...');

        const metrics = await pipelineService.getMetrics({
          startDate: options.startDate,
          endDate: options.endDate,
        });

        if (options.output === 'json') {
          console.log(
            JSON.stringify(
              {
                successful: metrics.successfulRuns,
                failed: metrics.failedRuns,
                total: metrics.totalRuns,
              },
              null,
              2
            )
          );
        } else {
          console.log('\n=== Pipelines by Status ===\n');
          console.log(`✅ Successful: ${metrics.successfulRuns}`);
          console.log(`❌ Failed: ${metrics.failedRuns}`);
          console.log(`📊 Total: ${metrics.totalRuns}`);
        }
      } catch (error) {
        logger.error('Failed to analyze pipelines by status', error);
        process.exit(1);
      }
    });

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

        const metrics = await pipelineService.getMetrics({
          startDate: options.startDate,
          endDate: options.endDate,
        });

        if (options.output === 'json') {
          console.log(JSON.stringify({ averageDuration: metrics.averageDurationMinutes }, null, 2));
        } else {
          console.log('\n=== Pipeline Run Durations ===\n');
          if (options.workflow) {
            console.log(`Workflow: ${options.workflow}`);
          }
          console.log(`Average Duration: ${metrics.averageDurationMinutes.toFixed(2)} minutes`);
          console.log(`Total Runs: ${metrics.totalRuns}`);
        }
      } catch (error) {
        logger.error('Failed to analyze pipeline run durations', error);
        process.exit(1);
      }
    });

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

        const metrics = await pipelineService.getDeploymentFrequency(
          options.period, { startDate: options.startDate, endDate: options.endDate, }
        );

        if (options.output === 'json') {
          console.log(JSON.stringify(metrics, null, 2));
        } else {
          console.log('\n=== Pipeline Runs by Period ===\n');
          console.log(`Period: ${options.period}`);
          metrics.forEach(item => {
            console.log(`Total Runs: ${item.count}`);
            console.log(`Duration in minutes: ${item.averageDurationMinutes} per ${options.period}`);
            console.log(`Sucess rate: ${item.successRate} per ${options.period}`);
          });
        }
      } catch (error) {
        logger.error('Failed to analyze pipeline runs by period', error);
        process.exit(1);
      }
    });

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

        const metrics = await pipelineService.getJobMetrics({
          startDate: options.startDate,
          endDate: options.endDate,
        });

        if (options.output === 'json') {
          console.log(JSON.stringify(metrics, null, 2));
        } else {
          console.log('\n=== Pipeline Jobs Summary ===\n\n');

          metrics.forEach(item => {
            console.log(`Job name: ${item.jobName}`);
            console.log(`Total Jobs: ${item.totalRuns}`);
            console.log(`Reruns: ${item.rerunCount}`);
            console.log(`Success rate: ${item.successRate}`);
            console.log(`Average Duration Minutes: ${item.averageDurationMinutes}`);
            console.log(`Failure count: ${item.failureCount}`);
            console.log('\n\n');
          });
        }
      } catch (error) {
        logger.error('Failed to generate jobs summary', error);
        process.exit(1);
      }
    });

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

        const metrics = await pipelineService.getJobMetrics({
          startDate: options.startDate,
          endDate: options.endDate,
        });

        if (options.output === 'json') {
          console.log(JSON.stringify(metrics, null, 2));
        } else {
          console.log('\n=== Job Execution Times ===\n');
          metrics.forEach(item => {
            console.log(`Job: ${item.jobName}\n`);
            console.log(`Total runs: ${item.totalRuns}`);
            console.log(`Failure count: ${item.failureCount}`);
            console.log(`Success rate: ${item.successRate}`);
            console.log(`Average Execution Time: ${item.averageDurationMinutes.toFixed(2)} minutes`);
          });
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

        const metrics = await pipelineService.getJobMetrics({
          startDate: options.startDate,
          endDate: options.endDate,
        });

        if (options.output === 'json') {
          console.log(
            JSON.stringify(
              metrics,
              null,
              2
            )
          );
        } else {
          metrics.forEach(item => {
            console.log('\n=== Jobs by Status ===\n');
            console.log(`Name: ${item.jobName}`);
            console.log(`✅ Successful: ${item.successCount}, success rate: ${item.successCount}`);
            console.log(`❌ Failed: ${item.failureCount}`);
            console.log(`Average duration in minutes: ${item.averageDurationMinutes}`);
          })
        }
      } catch (error) {
        logger.error('Failed to analyze jobs by status', error);
        process.exit(1);
      }
    });

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

        const metrics = await pipelineService.getDeploymentFrequency(
          options.period as 'day' | 'week' | 'month', {
          startDate: options.startDate,
          endDate: options.endDate,
        });

        if (options.output === 'json') {
          console.log(
            JSON.stringify(metrics, null, 2)
          );
        } else {
          console.log('\n=== Deployment Frequency (DORA) ===\n');

          metrics.forEach(item => {
            console.log(`Period: ${item.period}`);
            console.log(`Total Deployments: ${item.count}`);

            // DORA rating
            let rating = 'Low';
            if (options.period === 'day' && item.count >= 1) {
              rating = 'Elite';
            } else if (options.period === 'week' && item.count >= 1) {
              rating = 'High';
            } else if (options.period === 'month' && item.count >= 1) {
              rating = 'Medium';
            }
            console.log(`\n📈 DORA Rating: ${rating}`);
          })
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

        const metrics = await pipelineService.getMetrics({
          startDate: options.startDate,
          endDate: options.endDate,
        });

        const leadTime = metrics.averageDurationMinutes;

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
