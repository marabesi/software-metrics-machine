import { logger } from '@smmachine/utils';
import { FileSystemRepository } from '../../infrastructure/repository';
import { type IGithubPrsClient } from '.';
import { PullRequestCommentJsonResponse, PullRequestJsonResponse } from './github-response-types';
import { Configuration } from 'src';

export interface IPullRequestsRepository {
  fetchPRs(options?: {
    startDate?: string;
    endDate?: string;
    forceRefresh?: boolean;
  }): Promise<PullRequestJsonResponse[]>;

  fetchPRComments(prNumber: number): Promise<PullRequestCommentJsonResponse[]>;
}

export class GitHubPullRequestsFetchRepository implements IPullRequestsRepository {
  private pullRequestStoreFile: FileSystemRepository<PullRequestJsonResponse>;
  private pullRequestCommentsStoreFile: FileSystemRepository<PullRequestCommentJsonResponse>;

  constructor(
    private githubPrsClient: IGithubPrsClient,
    config: Configuration
  ) {
    const providerDir = config.getPathFromGitProvider();
    this.pullRequestStoreFile = new FileSystemRepository<PullRequestJsonResponse>(
      `${providerDir}/prs.json`
    );
    this.pullRequestCommentsStoreFile = new FileSystemRepository<PullRequestCommentJsonResponse>(
      `${providerDir}/pr-comments.json`
    );
  }

  /**
   * Refresh PR data from GitHub
   */
  async fetchPRs(options?: {
    startDate?: string;
    endDate?: string;
    forceRefresh?: boolean;
  }): Promise<PullRequestJsonResponse[]> {
    const fromCache = await this.pullRequestStoreFile.loadAll();

    if (!options?.forceRefresh && fromCache.length > 0) {
      logger.debug(`Using cached PRs: ${fromCache.length} records`);
      return fromCache;
    }

    logger.info('Fetching PRs from GitHub...');
    const freshPRs = await this.githubPrsClient.fetchPRs({
      startDate: options?.startDate,
      endDate: options?.endDate,
    });

    // Persist fetched data to disk so subsequent commands can reuse cached data.
    await this.pullRequestStoreFile.saveAll(freshPRs);

    return freshPRs;
  }

  async fetchPRComments(
    prNumber: number,
    options?: { forceRefresh?: boolean }
  ): Promise<PullRequestCommentJsonResponse[]> {
    const fromCache = await this.pullRequestCommentsStoreFile.loadAll();
    const cachedCommentsForPR = fromCache.filter((comment) =>
      comment.pull_request_url.includes(`/pulls/${prNumber}`)
    );

    if (!options?.forceRefresh && cachedCommentsForPR.length > 0) {
      logger.debug(
        `Using cached comments for PR #${prNumber}: ${cachedCommentsForPR.length} records`
      );
      return cachedCommentsForPR;
    }

    logger.info(`Fetching comments for PR #${prNumber} from GitHub...`);
    const freshComments = await this.githubPrsClient.fetchPRComments(prNumber);

    const updatedComments = fromCache
      .filter((comment) => !comment.pull_request_url.includes(`/pulls/${prNumber}`))
      .concat(freshComments);

    await this.pullRequestCommentsStoreFile.saveAll(updatedComments);

    return freshComments;
  }
}
