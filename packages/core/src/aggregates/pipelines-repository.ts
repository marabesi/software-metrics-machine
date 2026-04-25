import { logger } from '@smm/utils';
import { FileSystemRepository } from '../../src/infrastructure/repository';
import { PipelineRun } from 'src/domain-types';
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
  }): Promise<PipelineRun[]> {
    const fromCache = await this.cache.loadAll();

    if (!options?.forceRefresh && fromCache.length > 0) {
      logger.info(`Using cached pipelines: ${fromCache.length} records`);
      return fromCache;
    }

    logger.info('Fetching workflows from GitHub...');
    const freshWorkflows = await this.githubWorkflowClient.fetchWorkflows({
      startDate: options?.startDate,
      endDate: options?.endDate,
    });

    // Save to cache
    // if (freshWorkflows.length > 0) {
    //   await this.cache.saveAll(
    //     new Map(freshWorkflows.map((w, idx: number) => [`workflow-${idx}`, w as PipelineRun]))
    //   );
    // }

    return freshWorkflows as PipelineRun[];
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
