import { logger } from '@smmachine/utils';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Configuration, IRepository } from '../../infrastructure';
import { WorkflowJobJsonResponse, WorkflowJsonResponse } from './github-response-types';
import { IGithubWorkflowJobClient } from './github-workflow';

interface JobsProgress {
  processedRunIds: string[];
  partial?: {
    runId: string;
    page: number;
  } | null;
}

export class PipelinesJobFetchRepository {
  constructor(
    private configuration: Configuration,
    private githubWorkflowClient: IGithubWorkflowJobClient,
    private pipelineRunFileSystemRepository: IRepository<WorkflowJsonResponse>,
    private pipelineJobsFileSystemRepository: IRepository<WorkflowJobJsonResponse>
  ) {}

  async fetchJobs(filters: {
    forceRefresh?: boolean;
    startDate?: string;
    endDate?: string;
    rawFilters?: string;
    byDay?: boolean;
  }): Promise<WorkflowJobJsonResponse[]> {
    const cachedJobs = await this.pipelineJobsFileSystemRepository.loadAll();

    if (cachedJobs.length > 0 && !filters?.forceRefresh) {
      logger.info(`Using cached jobs: ${cachedJobs.length} records`);
      return cachedJobs;
    }

    const cachedRuns = await this.pipelineRunFileSystemRepository.loadAll();

    if (filters?.byDay && filters?.startDate && filters?.endDate) {
      return this.fetchJobsByDay(
        cachedRuns,
        filters.startDate,
        filters.endDate,
        filters.rawFilters
      );
    } else {
      const startDate = this.toDateBoundary(filters.startDate, 'start');
      const endDate = this.toDateBoundary(filters.endDate, 'end');

      const filteredRuns = this.filterRunsByDateRange(cachedRuns, startDate, endDate);
      logger.info(`Fetching jobs for ${filteredRuns.length} workflow runs...`);
      return this.fetchJobsWithResume(filteredRuns, filters.rawFilters);
    }
  }

  private async fetchJobsByDay(
    cachedRuns: WorkflowJsonResponse[],
    startDate: string,
    endDate: string,
    rawFilters?: string
  ): Promise<WorkflowJobJsonResponse[]> {
    const allJobs: WorkflowJobJsonResponse[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const dayStart = new Date(current);
      dayStart.setUTCHours(0, 0, 0, 0);

      const dayEnd = new Date(current);
      dayEnd.setUTCHours(23, 59, 59, 999);

      logger.info(`Fetching jobs for day ${dayStart.toISOString().split('T')[0]}...`);

      const runsForDay = cachedRuns.filter((run) => {
        const createdAt = run.created_at;
        if (!createdAt || createdAt.trim().length === 0) {
          return false;
        }

        const runDate = new Date(createdAt);
        if (Number.isNaN(runDate.getTime())) {
          return false;
        }

        return runDate >= dayStart && runDate <= dayEnd;
      });

      if (runsForDay.length > 0) {
        const dayJobs = await this.fetchJobsWithResume(runsForDay, rawFilters);
        allJobs.push(...dayJobs);
      }

      current.setUTCDate(current.getUTCDate() + 1);
    }

    return allJobs;
  }

  private filterRunsByDateRange(
    runs: WorkflowJsonResponse[],
    startDate: Date | undefined,
    endDate: Date | undefined
  ): WorkflowJsonResponse[] {
    return runs.filter((run) => {
      const createdAt = run.created_at;
      if (!createdAt || createdAt.trim().length === 0) {
        return false;
      }

      const runDate = new Date(createdAt);
      if (Number.isNaN(runDate.getTime())) {
        return false;
      }

      if (!startDate && !endDate) {
        return true;
      }

      if (startDate && runDate < startDate) {
        return false;
      }

      if (endDate && runDate > endDate) {
        return false;
      }

      return true;
    });
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
          allJobs.push(...response.jobs);
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
          const statusCode = this.getHttpStatusCode(error);

          if (statusCode === 404) {
            logger.error(
              `Skipping workflow run ${runId} at page ${page}: jobs endpoint returned 404`
            );

            processedRunIds.add(runId);
            await this.writeJson(incompletedPath, allJobs);
            await this.writeJson(progressPath, {
              processedRunIds: Array.from(processedRunIds),
              partial: null,
            });
            break;
          }

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
    return path.join(this.configuration.getPathFromGitProvider(), fileName);
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

  private getHttpStatusCode(error: unknown): number | undefined {
    const err = error as
      | { status?: number; response?: { status?: number } }
      | undefined;
    return err?.status ?? err?.response?.status;
  }

  private toDateBoundary(
    dateValue?: string,
    boundary: 'start' | 'end' = 'start'
  ): Date | undefined {
    if (!dateValue) {
      return undefined;
    }

    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateValue);
    const normalizedDateValue = isDateOnly
      ? boundary === 'start'
        ? `${dateValue}T00:00:00.000Z`
        : `${dateValue}T23:59:59.999Z`
      : dateValue;

    const parsed = new Date(normalizedDateValue);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
}
