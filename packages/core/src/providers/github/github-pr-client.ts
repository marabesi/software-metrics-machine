import axios, { AxiosInstance } from 'axios';
import { Logger } from '@smmachine/utils';
import { PullRequestCommentJsonResponse, PullRequestJsonResponse } from './github-response-types';

export interface IGithubPrsClient {
  fetchPRs(options?: {
    startDate?: string;
    endDate?: string;
    state?: 'open' | 'closed' | 'all';
  }): Promise<PullRequestJsonResponse[]>;

  fetchPRComments(prNumber: number): Promise<PullRequestCommentJsonResponse[]>;
}

/**
 * GitHub API client for Pull Requests
 * Real implementation using GitHub REST API v3
 * Endpoints utilized:
 *   - GET /repos/{owner}/{repo}/pulls - List PRs with state filtering
 *   - GET /repos/{owner}/{repo}/pulls/{pull_number}/comments - Get PR comments
 */
export class GithubPrsClient implements IGithubPrsClient {
  private readonly axiosInstance: AxiosInstance;
  private logger: Logger;
  private readonly baseUrl = 'https://api.github.com';

  constructor(
    token: string,
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
  }): Promise<PullRequestJsonResponse[]> {
    const state = options?.state || 'all';
    const per_page = 100;
    let page = 1;
    const allPRs: PullRequestJsonResponse[] = [];

    try {
      // Fetch all PRs with pagination
      while (true) {
        this.logger.info(
          `Fetching PRs page ${page} for ${this.owner}/${this.repo} (state: ${state})`
        );

        const response = await this.axiosInstance.get(`/repos/${this.owner}/${this.repo}/pulls`, {
          params: {
            state,
            sort: 'created',
            direction: 'desc',
            per_page,
            page,
          },
        });

        const prs = response.data;

        if (prs.length === 0) {
          break; // No more pages
        }

        // Keep the full GitHub payload and add compatibility aliases.
        for (const pr of prs) {
          const prDetail: PullRequestJsonResponse = { ...pr };

          // Filter by date if provided
          if (options?.startDate && new Date(pr.created_at) < new Date(options.startDate)) {
            break; // Stop pagination if we've gone past startDate
          }

          if (!options?.endDate || new Date(pr.created_at) <= new Date(options.endDate)) {
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

  async fetchPRComments(prNumber: number): Promise<PullRequestCommentJsonResponse[]> {
    let allComments: PullRequestCommentJsonResponse[] = [];
    let page = 1;
    const per_page = 100;

    try {
      while (true) {
        this.logger.info(
          `Fetching comments for PR #${prNumber} page ${page} in ${this.owner}/${this.repo}`
        );

        const response = await this.axiosInstance.get(
          `/repos/${this.owner}/${this.repo}/pulls/${prNumber}/comments`,
          {
            params: {
              per_page,
              page,
            },
          }
        );

        const comments: PullRequestCommentJsonResponse[] = response.data.map(
          (comment: PullRequestCommentJsonResponse) => comment
        );

        if (comments.length === 0) {
          break; // No more pages
        }

        allComments = allComments.concat(comments);

        if (comments.length < per_page) {
          break; // Last page
        }

        page++;
      }

      this.logger.info(`Fetched ${allComments.length} comments for PR #${prNumber} total`);
      return allComments;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(`GitHub API error fetching PR comments: ${error.message}`);
        throw new Error(`Failed to fetch PR comments: ${error.message}`);
      }
      throw error;
    }
  }
}
