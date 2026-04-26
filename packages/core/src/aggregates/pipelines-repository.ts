import { logger } from '@smm/utils';
import { FileSystemRepository } from '../../src/infrastructure/repository';
import { PipelineRun } from '../domain-types';
import { GithubWorkflowClient } from '../../src/providers/github';
import { PipelinesService } from '../../src/domain/pipelines';

export interface IPipelinesRepository {
  getPipelineMetrics(filters?: any): Promise<any>;
  getDeploymentFrequency(interval: 'day' | 'week' | 'month', filters?: any): Promise<any>;
  getJobMetrics(filters?: any): Promise<any>;
}

/**
 * Combines GitHub Workflows provider with Pipeline domain logic
 * Handles:
 * - Fetching workflows/jobs from GitHub
 * - Caching locally
 * - Computing deployment frequency
 * - Computing job metrics
 */
export class PipelinesRepository implements IPipelinesRepository {
  private pipelineService: PipelinesService;
  private cache: FileSystemRepository<PipelineRun>;

  constructor(
    private githubWorkflowClient: GithubWorkflowClient,
    cacheDir: string
  ) {
    this.cache = new FileSystemRepository<PipelineRun>(`${cacheDir}/workflows.json`);
    this.pipelineService = new PipelinesService(this.cache);
  }

  /**
   * Refresh pipeline data from GitHub
   */
  async refreshPipelines(options?: {
    startDate?: string;
    endDate?: string;
    forceRefresh?: boolean;
    includeJobs?: boolean;
  }): Promise<PipelineRun[]> {
    const fromCache = await this.cache.loadAll();

    if (!options?.forceRefresh && fromCache.length > 0) {
      if (options?.includeJobs) {
        const missingJobs = fromCache.filter((run) => !run.jobs || run.jobs.length === 0);

        if (missingJobs.length > 0) {
          logger.info(`Fetching jobs for ${missingJobs.length} cached workflow runs...`);
          const workflowIds = missingJobs.map((run) => String(run.id));
          const jobs = await this.githubWorkflowClient.fetchJobsForWorkflows(workflowIds);

          const jobsByRunId = new Map<string, any[]>();
          for (const job of jobs) {
            const runId = String(job.runId);
            const existing = jobsByRunId.get(runId) || [];
            existing.push(job);
            jobsByRunId.set(runId, existing);
          }

          const enrichedRuns = fromCache.map((run) => ({
            ...run,
            jobs: jobsByRunId.get(String(run.id)) || run.jobs || [],
          }));

          await this.cache.saveAll(enrichedRuns);
          return enrichedRuns;
        }
      }

      logger.info(`Using cached pipelines: ${fromCache.length} records`);
      return fromCache;
    }

    logger.info('Fetching workflows from GitHub...');
    const freshWorkflows = await this.githubWorkflowClient.fetchWorkflows({
      startDate: options?.startDate,
      endDate: options?.endDate,
    });

    let workflows = freshWorkflows as PipelineRun[];

    if (options?.includeJobs && workflows.length > 0) {
      logger.info(`Fetching jobs for ${workflows.length} workflow runs...`);
      const workflowIds = workflows.map((run) => String(run.id));
      const jobs = await this.githubWorkflowClient.fetchJobsForWorkflows(workflowIds);

      const jobsByRunId = new Map<string, any[]>();
      for (const job of jobs) {
        const runId = String(job.runId);
        const existing = jobsByRunId.get(runId) || [];
        existing.push(job);
        jobsByRunId.set(runId, existing);
      }

      workflows = workflows.map((run) => ({
        ...run,
        jobs: jobsByRunId.get(String(run.id)) || [],
      }));
    }

    // Persist fetched workflows/jobs so metrics commands can run from local data.
    await this.cache.saveAll(workflows);

    return workflows;
  }

  /**
   * Get pipeline metrics
   */
  async getPipelineMetrics(filters?: any): Promise<any> {
    await this.refreshPipelines(filters);
    return this.pipelineService.getMetrics(filters);
  }

  /**
   * Get deployment frequency
   */
  async getDeploymentFrequency(
    interval: 'day' | 'week' | 'month',
    filters?: any
  ): Promise<any> {
    await this.refreshPipelines(filters);
    return this.pipelineService.getDeploymentFrequency(interval, filters);
  }

  /**
   * Get job metrics
   */
  async getJobMetrics(filters?: any): Promise<any> {
    await this.refreshPipelines(filters);
    return this.pipelineService.getJobMetrics(filters);
  }
}
