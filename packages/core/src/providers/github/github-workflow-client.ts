import axios, { AxiosInstance } from 'axios';
import { Logger } from '@smmachine/utils';
import { PipelineRun } from '../../domain';
import { GitHubWorkflowResponse, IGithubWorkflowClient } from './github-workflow';

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
  }): Promise<PipelineRun[]> {
    const per_page = 100;
    let page = 1;
    const allRuns: PipelineRun[] = [];

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
            commit: run.head_sha,
            jobs: [],
            number: Number(run.run_number),
            createdAt: run.created_at,
            updatedAt: run.updated_at,
            startedAt: run.run_started_at,
            completedAt: run.updated_at,
            branch: run.head_branch,
            path: run.path,
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

  async fetchWorkflowRunsPage(
    page: number,
    perPage: number = 100,
    options?: { created?: string; rawFilters?: string }
  ): Promise<GitHubWorkflowResponse> {
    const requestParams = {
      params: {
        per_page: perPage,
        page,
        ...(options?.created ? { created: options.created } : {}),
        ...this.parseRawFilters(options?.rawFilters),
      },
    };
    const url = `/repos/${this.owner}/${this.repo}/actions/runs`;

    this.logger.info(`${url} ${JSON.stringify(requestParams.params)}`);

    const response = await this.axiosInstance.get(url, requestParams);

    const runs = response.data.workflow_runs || [];
    this.logger.info(`Fetched ${runs.length} workflow runs`);

    const hasNext = this.hasNextLink(response.headers?.link) || runs.length === perPage;
    return { runs, hasNext };
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
