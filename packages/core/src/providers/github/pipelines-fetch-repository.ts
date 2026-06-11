import { logger } from '@smmachine/utils';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Configuration, IRepository } from '../../infrastructure';
import { type IGithubWorkflowClient } from '../index';
import { WorkflowJsonResponse } from './github-response-types';
import { PipelineFiltersRepository } from '../../aggregates/pipeline-filters-repository';

interface WorkflowsProgress {
  page: number;
}

export class PipelinesFetchRepository {
  constructor(
    private configuration: Configuration,
    private githubWorkflowClient: IGithubWorkflowClient,
    private pipelineRunFileSystemRepository: IRepository<WorkflowJsonResponse>,
    private pipelineFiltersRepository?: PipelineFiltersRepository
  ) {}

  async fetchPipelines(options?: {
    startDate?: string;
    endDate?: string;
    rawFilters?: string;
    forceRefresh?: boolean;
    byDay?: boolean;
    incrementalUpdate?: boolean;
  }): Promise<WorkflowJsonResponse[]> {
    const fromCache = await this.pipelineRunFileSystemRepository.loadAll();

    if (options?.incrementalUpdate && fromCache.length > 0) {
      const latestDate = this.findLatestDate(fromCache.map((r) => r.updated_at));
      logger.info(`Incremental update: fetching pipelines updated after ${latestDate}...`);
      let freshRuns: WorkflowJsonResponse[];

      if (options?.byDay && options?.endDate) {
        freshRuns = await this.fetchWorkflowsByDay(latestDate, options.endDate, options.rawFilters);
      } else {
        freshRuns = await this.fetchWorkflowsWithResume({
          created: this.buildCreatedFilter(latestDate, options?.endDate),
          rawFilters: options?.rawFilters,
        });
      }

      const merged = this.mergeById(fromCache, freshRuns);
      await this.pipelineRunFileSystemRepository.saveAll(merged);
      await this.refreshDashboardFilterOptions();
      return merged;
    }

    // Manual date range with merge
    if (
      (options?.startDate || options?.endDate) &&
      !options?.forceRefresh &&
      fromCache.length > 0
    ) {
      logger.info(
        `Fetching pipelines for range [${options?.startDate || 'any'}..${options?.endDate || 'any'}] and merging with cache...`
      );
      let workflows: WorkflowJsonResponse[];
      if (options?.byDay && options?.startDate && options?.endDate) {
        workflows = await this.fetchWorkflowsByDay(
          options.startDate,
          options.endDate,
          options.rawFilters
        );
      } else {
        workflows = await this.fetchWorkflowsWithResume({
          created: this.buildCreatedFilter(options?.startDate, options?.endDate),
          rawFilters: options?.rawFilters,
        });
      }
      const merged = this.mergeById(fromCache, workflows);
      await this.pipelineRunFileSystemRepository.saveAll(merged);
      await this.refreshDashboardFilterOptions();
      return merged;
    }

    if (fromCache.length > 0 && !options?.forceRefresh) {
      logger.info(`Using cached pipelines: ${fromCache.length} records`);
      return fromCache;
    }

    logger.info(`Fetching workflows from GitHub ${options?.startDate} - ${options?.endDate}...`);
    let workflows: WorkflowJsonResponse[];

    if (options?.byDay && options?.startDate && options?.endDate) {
      workflows = await this.fetchWorkflowsByDay(
        options.startDate,
        options.endDate,
        options.rawFilters
      );
    } else {
      workflows = await this.fetchWorkflowsWithResume({
        created: this.buildCreatedFilter(options?.startDate, options?.endDate),
        rawFilters: options?.rawFilters,
      });
    }
    // Persist fetched workflows/jobs so metrics commands can run from local data.
    await this.pipelineRunFileSystemRepository.saveAll(workflows);
    await this.refreshDashboardFilterOptions();

    return workflows;
  }

  private async refreshDashboardFilterOptions(): Promise<void> {
    await this.pipelineFiltersRepository?.refreshOptions();
  }

  private async fetchWorkflowsByDay(
    startDate: string,
    endDate: string,
    rawFilters?: string
  ): Promise<WorkflowJsonResponse[]> {
    const allRuns: WorkflowJsonResponse[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const dayStart = new Date(current);
      dayStart.setUTCHours(0, 0, 0, 0);

      const dayEnd = new Date(current);
      dayEnd.setUTCHours(23, 59, 59, 999);

      const dayStartStr = dayStart.toISOString().split('T')[0] + 'T00:00:00Z';
      const dayEndStr = dayEnd.toISOString().split('T')[0] + 'T23:59:59Z';

      logger.info(`Fetching workflows for day ${dayStartStr}...`);

      const dayRuns = await this.fetchWorkflowsWithResume({
        created: `${dayStartStr}..${dayEndStr}`,
        rawFilters,
      });

      allRuns.push(...dayRuns);
      current.setUTCDate(current.getUTCDate() + 1);
    }

    return allRuns;
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

  private findLatestDate(dates: (string | undefined | null)[]): string {
    const valid = dates.filter((d): d is string => !!d).map((d) => new Date(d).getTime());
    if (valid.length === 0) return new Date(0).toISOString();
    return new Date(Math.max(...valid)).toISOString();
  }

  private mergeById(
    existing: WorkflowJsonResponse[],
    incoming: WorkflowJsonResponse[]
  ): WorkflowJsonResponse[] {
    const map = new Map<string, WorkflowJsonResponse>();
    for (const run of existing) map.set(run.id, run);
    for (const run of incoming) map.set(run.id, run);
    return Array.from(map.values());
  }

  private buildCreatedFilter(startDate?: string, endDate?: string): string | undefined {
    if (!startDate && !endDate) {
      return undefined;
    }

    return `${startDate || ''}..${endDate || ''}`;
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
}
