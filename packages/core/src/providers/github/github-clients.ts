import axios, { AxiosInstance } from 'axios';
import { PRDetails } from '../../domain-types';
import { Logger } from '@smm/utils';

export interface IGithubPrsClient {
  fetchPRs(options?: {
    startDate?: string;
    endDate?: string;
    state?: 'open' | 'closed' | 'all';
  }): Promise<PRDetails[]>;

  fetchPRComments(prNumber: number): Promise<any[]>;
}

export interface IGithubWorkflowClient {
  fetchWorkflows(options?: {
    startDate?: string;
    endDate?: string;
  }): Promise<any[]>;

  fetchJobsForWorkflows(workflowIds: string[]): Promise<any[]>;
}

/**
 * GitHub API client for Pull Requests
 * Real implementation using GitHub REST API v3
 * Endpoints utilized:
 *   - GET /repos/{owner}/{repo}/pulls - List PRs with state filtering
 *   - GET /repos/{owner}/{repo}/pulls/{pull_number}/comments - Get PR comments
 */
export class GithubPrsClient implements IGithubPrsClient {
  private axiosInstance: AxiosInstance;
  private logger: Logger;
  private readonly baseUrl = 'https://api.github.com';

  constructor(
    private token: string,
    private owner: string,
    private repo: string
  ) {
    this.logger = new Logger('GithubPrsClient');
    
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
      timeout: 30000,
    });
  }

  async fetchPRs(options?: {
    startDate?: string;
    endDate?: string;
    state?: 'open' | 'closed' | 'all';
  }): Promise<PRDetails[]> {
    const state = options?.state || 'all';
    const per_page = 100;
    let page = 1;
    const allPRs: PRDetails[] = [];

    try {
      // Fetch all PRs with pagination
      while (true) {
        this.logger.info(
          `Fetching PRs page ${page} for ${this.owner}/${this.repo} (state: ${state})`
        );

        const response = await this.axiosInstance.get(
          `/repos/${this.owner}/${this.repo}/pulls`,
          {
            params: {
              state,
              sort: 'created',
              direction: 'desc',
              per_page,
              page,
            },
          }
        );

        const prs = response.data;

        if (prs.length === 0) {
          break; // No more pages
        }

        // Keep the full GitHub payload and add compatibility aliases.
        for (const pr of prs) {
          const prDetail: PRDetails = {
            ...pr,
            author: { login: pr.user?.login, id: pr.user?.id },
            createdAt: pr.created_at,
            updatedAt: pr.updated_at,
            mergedAt: pr.merged_at,
            closedAt: pr.closed_at,
            url: pr.html_url,
            comments: pr.comments || 0,
            labels: (pr.labels || []).map((label: any) => ({
              ...label,
              name: label.name,
              description: label.description,
            })),
          };

          // Filter by date if provided
          if (
            options?.startDate &&
            new Date(pr.created_at) < new Date(options.startDate)
          ) {
            break; // Stop pagination if we've gone past startDate
          }

          if (
            !options?.endDate ||
            new Date(pr.created_at) <= new Date(options.endDate)
          ) {
            allPRs.push(prDetail);
          }
        }

        // Stop if we got fewer items than requested (last page)
        if (prs.length < per_page) {
          break;
        }

        page++;
      }

      this.logger.info(`Fetched ${allPRs.length} PRs total`);
      return allPRs;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          `GitHub API error fetching PRs: ${error.response?.status} - ${error.response?.statusText}`
        );
        if (error.response?.status === 401) {
          throw new Error('GitHub authentication failed - invalid token');
        }
        throw new Error(`Failed to fetch PRs: ${error.message}`);
      }
      throw error;
    }
  }

  async fetchPRComments(prNumber: number): Promise<any[]> {
    try {
      this.logger.info(
        `Fetching comments for PR #${prNumber} in ${this.owner}/${this.repo}`
      );

      const response = await this.axiosInstance.get(
        `/repos/${this.owner}/${this.repo}/pulls/${prNumber}/comments`,
        {
          params: {
            per_page: 100,
          },
        }
      );

      this.logger.info(`Fetched ${response.data.length} comments`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          `GitHub API error fetching PR comments: ${error.message}`
        );
        throw new Error(`Failed to fetch PR comments: ${error.message}`);
      }
      throw error;
    }
  }
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
    private token: string,
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
  }): Promise<any[]> {
    const per_page = 100;
    let page = 1;
    const allRuns: any[] = [];

    try {
      // Fetch all workflow runs with pagination
      while (true) {
        this.logger.info(
          `Fetching workflow runs page ${page} for ${this.owner}/${this.repo}`
        );

        const response = await this.axiosInstance.get(
          `/repos/${this.owner}/${this.repo}/actions/runs`,
          {
            params: {
              per_page,
              page,
            },
          }
        );

        const runs = response.data.workflow_runs;

        if (!runs || runs.length === 0) {
          break; // No more runs
        }

        for (const run of runs) {
          // Filter by date if provided
          if (
            options?.startDate &&
            new Date(run.created_at) < new Date(options.startDate)
          ) {
            page = -1; // Signal to break outer loop
            break;
          }

          if (
            !options?.endDate ||
            new Date(run.created_at) <= new Date(options.endDate)
          ) {
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
        }

        if (page < 0) break;
        if (runs.length < per_page) break;

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
        this.logger.info(
          `Fetching jobs for workflow run ${runId} in ${this.owner}/${this.repo}`
        );

        const response = await this.axiosInstance.get(
          `/repos/${this.owner}/${this.repo}/actions/runs/${runId}/jobs`,
          {
            params: {
              per_page: 100,
            },
          }
        );

        const jobs = response.data.jobs || [];

        for (const job of jobs) {
          allJobs.push({
            ...job,
            startedAt: job.started_at,
            completedAt: job.completed_at,
            duration: this.calculateDuration(job.started_at, job.completed_at),
            runId,
          });
        }
      }

      this.logger.info(`Fetched ${allJobs.length} jobs total`);
      return allJobs;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          `GitHub API error fetching jobs: ${error.message}`
        );
        throw new Error(`Failed to fetch jobs: ${error.message}`);
      }
      throw error;
    }
  }

  private calculateDuration(startedAt: string, completedAt: string): number {
    if (!startedAt || !completedAt) return 0;
    return (
      new Date(completedAt).getTime() - new Date(startedAt).getTime()
    ) / 1000; // Duration in seconds
  }
}
