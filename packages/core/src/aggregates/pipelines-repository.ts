import { logger } from '@smmachine/utils';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Configuration, IRepository } from '../infrastructure';
import { type IGithubWorkflowClient } from '../providers';
import {
  WorkflowJobJsonResponse,
  WorkflowJsonResponse,
} from '../providers/github/github-response-types';
import { PipelineJob, PipelineRun } from '../domain';

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

export interface IPipelinesRepository {}

export class PipelinesRepository implements IPipelinesRepository {
  constructor(
    private configuration: Configuration,
    private githubWorkflowClient: IGithubWorkflowClient,
    private pipelineRunFileSystemRepository: IRepository<WorkflowJsonResponse>,
    private pipelineJobsFileSystemRepository: IRepository<WorkflowJobJsonResponse>
  ) {}

  async fetchPipelines(options?: {
    startDate?: string;
    endDate?: string;
    rawFilters?: string;
    forceRefresh?: boolean;
    includeJobs?: boolean;
  }): Promise<WorkflowJsonResponse[]> {
    const fromCache = await this.pipelineRunFileSystemRepository.loadAll();

    if (fromCache.length > 0 && !options?.forceRefresh) {
      logger.info(`Using cached pipelines: ${fromCache.length} records`);
      return fromCache;
    }

    console.log(`Fetching workflows from GitHub ${options?.startDate} - ${options?.endDate}...`);
    const workflows = await this.fetchWorkflowsWithResume({
      created: this.buildCreatedFilter(options?.startDate, options?.endDate),
      rawFilters: options?.rawFilters,
    });
    // Persist fetched workflows/jobs so metrics commands can run from local data.
    await this.pipelineRunFileSystemRepository.saveAll(workflows);

    if (options?.includeJobs) {
      console.log(`Fetching jobs for ${fromCache.length} cached workflow runs...`);
      await this.fetchJobsWithResume(workflows, options?.rawFilters);
      console.log(`Done`);
    }

    return workflows;
  }

  private async fetchWorkflowsWithResume(options?: {
    created?: string;
    startDate?: string;
    endDate?: string;
    rawFilters?: string;
  }): Promise<WorkflowJsonResponse[]> {
    const progressPath = this.fileInCache('workflows_progress.json');
    const incompletedPath = this.fileInCache('workflows_incompleted.json');

    const progress = await this.readJson<WorkflowsProgress | null>(progressPath, null);
    const runs: WorkflowJsonResponse[] = await this.readJson<any[]>(incompletedPath, []);

    let page = progress?.page || 1;
    const perPage = 100;
    let stopPagination = false;

    while (!stopPagination) {
      try {
        logger.info(`Fetching workflows total of ${perPage} in page ${page} from GitHub...`);
        const response = await this.githubWorkflowClient.fetchWorkflowRunsPage(page, perPage, {
          created: options?.created,
          rawFilters: options?.rawFilters,
        });
        const fetchedRuns = response.runs || [];

        if (fetchedRuns.length === 0) {
          break;
        }

        for (const run of fetchedRuns) {
          runs.push(run);
        }

        await this.writeJson(incompletedPath, runs);

        if (stopPagination || !response.hasNext) {
          break;
        }

        page += 1;
        await this.writeJson(progressPath, { page });
      } catch (error) {
        if (this.isUnprocessableEntityError(error)) {
          logger.info(
            `GitHub returned 422 while fetching workflows page ${page}; treating as pagination end.`
          );
          await this.writeJson(incompletedPath, runs);
          await this.writeJson(progressPath, { page });
          break;
        }

        await this.writeJson(incompletedPath, runs);
        await this.writeJson(progressPath, { page });
        throw error;
      }
    }

    await this.deleteFile(progressPath);
    await this.deleteFile(incompletedPath);
    return runs;
  }

  private buildCreatedFilter(startDate?: string, endDate?: string): string | undefined {
    if (!startDate && !endDate) {
      return undefined;
    }

    return `${startDate || ''}..${endDate || ''}`;
  }

  async fetchJobs(filters: {
    forceRefresh?: boolean;
    startDate?: string;
    endDate?: string;
    rawFilters?: string;
  }): Promise<WorkflowJobJsonResponse[]> {
    const cachedJobs = await this.pipelineJobsFileSystemRepository.loadAll();

    if (cachedJobs.length > 0 && !filters?.forceRefresh) {
      logger.info(`Using cached jobs: ${cachedJobs.length} records`);
      return cachedJobs;
    }

    const cachedRuns = await this.pipelineRunFileSystemRepository.loadAll();
    const filteredRuns = cachedRuns.filter((run) => {
      const startDate = filters.startDate;
      const endDate = filters.endDate;
      const createdAt = run.created_at;
      const runDate = new Date(createdAt);

      if (startDate && endDate) {
        return runDate >= new Date(startDate) && runDate <= new Date(endDate);
      }
      if (startDate && runDate < new Date(startDate)) {
        return false;
      }

      if (endDate && runDate > new Date(endDate)) {
        return false;
      }

      return true;
    });

    logger.info(`Fetching jobs for ${filteredRuns.length} workflow runs...`);

    return this.fetchJobsWithResume(filteredRuns, filters.rawFilters);
  }

  async fetchJobsWithResume(
    workflows: WorkflowJsonResponse[],
    rawFilters?: string
  ): Promise<WorkflowJobJsonResponse[]> {
    const progressPath = this.fileInCache('jobs_progress.json');
    const incompletedPath = this.fileInCache('jobs_incompleted.json');

    const progress = await this.readJson<JobsProgress>(progressPath, {
      processedRunIds: [],
      partial: null,
    });

    const processedRunIds = new Set(progress.processedRunIds || []);
    const allJobs: WorkflowJobJsonResponse[] = await this.readJson<any[]>(incompletedPath, []);
    const perPage = 100;

    for (const run of workflows) {
      const runId = String((run as any).id);
      if (!runId || processedRunIds.has(runId)) {
        continue;
      }

      let page =
        progress.partial?.runId === runId && progress.partial?.page ? progress.partial.page : 1;

      while (true) {
        try {
          console.log(`Fetching jobs for workflow run ${runId} in page ${page}...`);
          const response = await this.githubWorkflowClient.fetchJobsPage(runId, page, perPage, {
            rawFilters,
          });
          const pageJobs: WorkflowJobJsonResponse[] = (response.jobs || []).map((job: any) => ({
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

    const existingJobs = await this.pipelineJobsFileSystemRepository.loadAll();
    const mergedJobsByKey = new Map<string, any>();

    for (const job of existingJobs) {
      mergedJobsByKey.set(`${String(job.run_id)}:${String(job.id)}`, job);
    }

    for (const job of allJobs) {
      mergedJobsByKey.set(`${String(job.run_id)}:${String(job.id)}`, job);
    }

    await this.pipelineJobsFileSystemRepository.saveAll(Array.from(mergedJobsByKey.values()));

    await this.deleteFile(progressPath);
    await this.deleteFile(incompletedPath);
    return allJobs;
  }

  private fileInCache(fileName: string): string {
    return path.join(this.configuration.getPipelinePath(), fileName);
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

  private isUnprocessableEntityError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const maybeError = error as {
      status?: number;
      response?: {
        status?: number;
      };
    };

    return maybeError.status === 422 || maybeError.response?.status === 422;
  }

  async loadPipelines(): Promise<PipelineRun[]> {
    const runs = await this.pipelineRunFileSystemRepository.loadAll();
    return runs.map(this.mapPipelinesToDomain);
  }

  async loadPipelineJobs(): Promise<PipelineJob[]> {
    const jobs = await this.pipelineJobsFileSystemRepository.loadAll();
    return jobs.map(this.mapPipelineJobsToDomain);
  }

  private mapPipelinesToDomain(run: WorkflowJsonResponse): PipelineRun {
    return {
      ...run,
      createdAt: run.created_at,
      updatedAt: run.updated_at,
      number: Number(run.run_number),
      startedAt: run.run_started_at,
      completedAt: run.updated_at,
      branch: run.head_branch,
      path: run.path,
    };
  }

  private mapPipelineJobsToDomain(job: WorkflowJobJsonResponse): PipelineJob {
    return {
      completedAt: job.completed_at,
      conclusion: job.conclusion,
      durationSeconds: this.calculateDurationInSeconds(job.started_at, job.completed_at),
      id: job.id,
      name: job.name,
      runId: job.run_id,
      startedAt: job.started_at,
      status: job.status,
    };
  }

  private calculateDurationInSeconds(startedAt: string, completedAt: string): number {
    if (!startedAt || !completedAt) return 0;
    return (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000;
  }
}
