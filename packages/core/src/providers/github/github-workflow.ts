import axios, { AxiosInstance } from 'axios';
import { logger } from '@smmachine/utils';
import { Logger } from '@smmachine/utils';

export interface IGithubWorkflowClient {
  fetchWorkflows(options?: { created?: string; rawFilters?: string }): Promise<any[]>;

  fetchJobsForWorkflows(workflowIds: string[]): Promise<any[]>;

  fetchWorkflowRunsPage(
    page: number,
    perPage?: number,
    options?: { rawFilters?: string; created?: string }
  ): Promise<{ runs: any[]; hasNext: boolean }>;

  fetchJobsPage(
    runId: string,
    page: number,
    perPage?: number,
    options?: { rawFilters?: string }
  ): Promise<{ jobs: any[]; hasNext: boolean }>;
}

/**
 * GitHub API client for Workflows (CI/CD)
 * Real implementation using GitHub REST API v3
 * Endpoints utilized:
 *   - GET /repos/{owner}/{repo}/actions/runs - List workflow runs
 *   - GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs - Get jobs for a run
 */
export class GithubWorkflowClient implements IGithubWorkflowClient {
  private axiosInstance: AxiosInstance;
  private logger: Logger;
  private readonly baseUrl = 'https://api.github.com';

  constructor(
    token: string,
    private owner: string,
    private repo: string
  ) {
    this.logger = new Logger('GithubWorkflowClient');

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
      timeout: 30000,
    });
  }

  async fetchWorkflows(options?: {
    startDate?: string;
    endDate?: string;
    rawFilters?: string;
  }): Promise<any[]> {
    const per_page = 100;
    let page = 1;
    const allRuns: any[] = [];

    try {
      // Fetch all workflow runs with pagination
      while (true) {
        this.logger.info(`Fetching workflow runs page ${page} for ${this.owner}/${this.repo}`);

        const optionsParams: any = {
          rawFilters: options?.rawFilters,
        };

        if (options?.startDate && options?.endDate) {
          optionsParams.created = `${options.startDate}..${options.endDate}`;
        }

        const response = await this.fetchWorkflowRunsPage(page, per_page, optionsParams);
        const runs = response.runs;

        if (!runs || runs.length === 0) {
          break; // No more runs
        }

        for (const run of runs) {
          allRuns.push({
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

        if (page < 0) break;
        if (!response.hasNext) break;

        page++;
      }

      this.logger.info(`Fetched ${allRuns.length} workflow runs total`);
      return allRuns;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          `GitHub API error fetching workflows: ${error.response?.status} - ${error.response?.statusText}`
        );
        if (error.response?.status === 401) {
          throw new Error('GitHub authentication failed - invalid token');
        }
        throw new Error(`Failed to fetch workflows: ${error.message}`);
      }
      throw error;
    }
  }

  async fetchJobsForWorkflows(workflowIds: string[]): Promise<any[]> {
    const allJobs: any[] = [];

    try {
      // Fetch jobs for each workflow run
      for (const runId of workflowIds) {
        let page = 1;
        this.logger.info(
          `Fetching jobs for workflow run ${runId} in ${this.owner}/${this.repo} - page ${page}`
        );

        while (true) {
          const response = await this.fetchJobsPage(runId, page, 100);
          const jobs = response.jobs || [];

          for (const job of jobs) {
            allJobs.push({
              ...job,
              startedAt: job.started_at,
              completedAt: job.completed_at,
              duration: this.calculateDuration(job.started_at, job.completed_at),
              runId,
            });
          }

          if (!response.hasNext) {
            break;
          }

          page += 1;
        }
      }

      this.logger.info(`Fetched ${allJobs.length} jobs total`);
      return allJobs;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(`GitHub API error fetching jobs: ${error.message}`);
        throw new Error(`Failed to fetch jobs: ${error.message}`);
      }
      throw error;
    }
  }

  private calculateDuration(startedAt: string, completedAt: string): number {
    if (!startedAt || !completedAt) return 0;
    return (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000; // Duration in seconds
  }

  async fetchWorkflowRunsPage(
    page: number,
    perPage: number = 100,
    options?: { created?: string; rawFilters?: string }
  ): Promise<{ runs: any[]; hasNext: boolean }> {
    const requestParams = {
      params: {
        per_page: perPage,
        page,
        ...(options?.created ? { created: options.created } : {}),
        ...this.parseRawFilters(options?.rawFilters),
      },
    };
    const url = `/repos/${this.owner}/${this.repo}/actions/runs`;

    logger.info(`${url} ${JSON.stringify(requestParams.params)}`);

    const response = await this.axiosInstance.get(url, requestParams);

    const runs = response.data.workflow_runs || [];
    logger.info(`Fetched ${runs.length} workflow runs`);

    const hasNext = this.hasNextLink(response.headers?.link) || runs.length === perPage;
    return { runs, hasNext };
  }

  async fetchJobsPage(
    runId: string,
    page: number,
    perPage: number = 100
  ): Promise<{ jobs: any[]; hasNext: boolean }> {
    const url = `/repos/${this.owner}/${this.repo}/actions/runs/${runId}/jobs`;
    const requestParams = {
      params: {
        per_page: perPage,
        page,
      },
    };

    logger.info(`${url} ${JSON.stringify(requestParams.params)}`);

    const response = await this.axiosInstance.get(url, requestParams);

    const jobs = response.data.jobs || [];
    const hasNext = this.hasNextLink(response.headers?.link) || jobs.length === perPage;
    return { jobs, hasNext };
  }

  private hasNextLink(linkHeader?: string): boolean {
    if (!linkHeader) {
      return false;
    }
    return linkHeader.includes('rel="next"');
  }

  private parseRawFilters(rawFilters?: string): Record<string, string> {
    if (!rawFilters) {
      return {};
    }

    return rawFilters.split(',').reduce<Record<string, string>>((filters, entry) => {
      const trimmedEntry = entry.trim();
      if (!trimmedEntry) {
        return filters;
      }

      const separatorIndex = trimmedEntry.indexOf('=');
      if (separatorIndex <= 0) {
        return filters;
      }

      const key = trimmedEntry.slice(0, separatorIndex).trim();
      const value = trimmedEntry.slice(separatorIndex + 1).trim();

      if (!key || !value) {
        return filters;
      }

      filters[key] = value;
      return filters;
    }, {});
  }
}
