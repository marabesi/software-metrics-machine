import { logger } from '@smmachine/utils';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Configuration, IRepository } from '../infrastructure';
import { type IGithubWorkflowClient } from '../providers';
import { WorkflowJsonResponse } from '../providers/github/github-response-types';

interface WorkflowsProgress {
  page: number;
}

export class PipelinesFetchRepository {
  constructor(
    private configuration: Configuration,
    private githubWorkflowClient: IGithubWorkflowClient,
    private pipelineRunFileSystemRepository: IRepository<WorkflowJsonResponse>
  ) {}

  async fetchPipelines(options?: {
    startDate?: string;
    endDate?: string;
    rawFilters?: string;
    forceRefresh?: boolean;
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
}
