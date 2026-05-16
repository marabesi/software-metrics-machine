import { logger } from '@smmachine/utils';
import * as fs from 'fs/promises';
import * as path from 'path';
import { FileSystemRepository } from '../infrastructure/repository';
import { PipelineRun } from '../domain-types';
import { type IGithubWorkflowClient } from '../providers/github';
import { PipelinesService } from '../domain/pipelines';

interface WorkflowsProgress {
  page: number;
}

interface JobsProgress {
  processedRunIds: string[];
  partial?: {
    runId: string;
    page: number;
  } | null;
}

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
  private cacheDir: string;

  constructor(
    private githubWorkflowClient: IGithubWorkflowClient,
    cacheDir: string
  ) {
    this.cacheDir = cacheDir;
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
          const jobs = await this.fetchJobsWithResume(missingJobs);

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
    const freshWorkflows = await this.fetchWorkflowsWithResume({
      startDate: options?.startDate,
      endDate: options?.endDate,
    });

    let workflows = freshWorkflows as PipelineRun[];

    if (options?.includeJobs && workflows.length > 0) {
      logger.info(`Fetching jobs for ${workflows.length} workflow runs...`);
      const jobs = await this.fetchJobsWithResume(workflows);

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

  private async fetchWorkflowsWithResume(options?: {
    startDate?: string;
    endDate?: string;
  }): Promise<PipelineRun[]> {
    const progressPath = this.fileInCache('workflows_progress.json');
    const incompletedPath = this.fileInCache('workflows_incompleted.json');

    const progress = await this.readJson<WorkflowsProgress | null>(progressPath, null);
    const runs = await this.readJson<any[]>(incompletedPath, []);

    let page = progress?.page || 1;
    const perPage = 100;
    let stopPagination = false;

    while (!stopPagination) {
      try {
        const response = await this.githubWorkflowClient.fetchWorkflowRunsPage(page, perPage);
        const fetchedRuns = response.runs || [];

        if (fetchedRuns.length === 0) {
          break;
        }

        for (const run of fetchedRuns) {
          if (options?.startDate && new Date(run.created_at) < new Date(options.startDate)) {
            stopPagination = true;
            break;
          }

          if (!options?.endDate || new Date(run.created_at) <= new Date(options.endDate)) {
            runs.push({
              ...run,
              createdAt: run.created_at,
              updatedAt: run.updated_at,
              runNumber: run.run_number,
              htmlUrl: run.html_url,
              startedAt: run.run_started_at,
              completedAt: run.updated_at,
              branch: run.head_branch,
              path: run.path || run.workflow_url || '',
            });
          }
        }

        await this.writeJson(incompletedPath, runs);

        if (stopPagination || !response.hasNext) {
          break;
        }

        page += 1;
        await this.writeJson(progressPath, { page });
      } catch (error) {
        await this.writeJson(incompletedPath, runs);
        await this.writeJson(progressPath, { page });
        throw error;
      }
    }

    await this.deleteFile(progressPath);
    await this.deleteFile(incompletedPath);
    return runs as PipelineRun[];
  }

  private async fetchJobsWithResume(workflows: PipelineRun[]): Promise<any[]> {
    const progressPath = this.fileInCache('jobs_progress.json');
    const incompletedPath = this.fileInCache('jobs_incompleted.json');

    const progress = await this.readJson<JobsProgress>(progressPath, {
      processedRunIds: [],
      partial: null,
    });

    const processedRunIds = new Set(progress.processedRunIds || []);
    const allJobs = await this.readJson<any[]>(incompletedPath, []);
    const perPage = 100;

    for (const run of workflows) {
      const runId = String((run as any).id);
      if (!runId || processedRunIds.has(runId)) {
        continue;
      }

      let page =
        progress.partial?.runId === runId && progress.partial?.page
          ? progress.partial.page
          : 1;

      while (true) {
        try {
          const response = await this.githubWorkflowClient.fetchJobsPage(runId, page, perPage);
          const pageJobs = (response.jobs || []).map((job: any) => ({
            ...job,
            startedAt: job.started_at,
            completedAt: job.completed_at,
            runId,
          }));
          allJobs.push(...pageJobs);
          await this.writeJson(incompletedPath, allJobs);

          if (response.hasNext) {
            page += 1;
            await this.writeJson(progressPath, {
              processedRunIds: Array.from(processedRunIds),
              partial: { runId, page },
            });
            continue;
          }

          processedRunIds.add(runId);
          await this.writeJson(progressPath, {
            processedRunIds: Array.from(processedRunIds),
            partial: null,
          });
          break;
        } catch (error) {
          await this.writeJson(incompletedPath, allJobs);
          await this.writeJson(progressPath, {
            processedRunIds: Array.from(processedRunIds),
            partial: { runId, page },
          });
          throw error;
        }
      }
    }

    await this.deleteFile(progressPath);
    await this.deleteFile(incompletedPath);
    return allJobs;
  }

  private fileInCache(fileName: string): string {
    return path.join(this.cacheDir, fileName);
  }

  private async readJson<T>(filePath: string, fallback: T): Promise<T> {
    try {
      const contents = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(contents) as T;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return fallback;
      }
      throw error;
    }
  }

  private async writeJson(filePath: string, value: unknown): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf-8');
  }

  private async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
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
