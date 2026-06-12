import { logger } from '@smmachine/utils';
import { FileSystemRepository } from '../../infrastructure/repository';
import { type IGithubPrsClient } from '.';
import { PullRequestCommentJsonResponse, PullRequestJsonResponse } from './github-response-types';
import { Configuration } from 'src';
import {
  PullRequestFilterOptions,
  PullRequestFiltersRepository,
} from '../../aggregates/pull-request-filters-repository';

export interface IPullRequestsRepository {
  fetchPRs(options?: {
    startDate?: string;
    endDate?: string;
    forceRefresh?: boolean;
    incrementalUpdate?: boolean;
  }): Promise<PullRequestJsonResponse[]>;

  fetchPRComments(
    prNumber: number,
    options?: { forceRefresh?: boolean; incrementalUpdate?: boolean }
  ): Promise<PullRequestCommentJsonResponse[]>;
}

export class GitHubPullRequestsFetchRepository implements IPullRequestsRepository {
  private pullRequestStoreFile: FileSystemRepository<PullRequestJsonResponse>;
  private pullRequestCommentsStoreFile: FileSystemRepository<PullRequestCommentJsonResponse>;
  private pullRequestFiltersRepository: PullRequestFiltersRepository;

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
    const pullRequestFiltersStoreFile = new FileSystemRepository<PullRequestFilterOptions>(
      `${providerDir}/pull-request-filter-options.json`
    );
    this.pullRequestFiltersRepository = new PullRequestFiltersRepository(
      this.pullRequestStoreFile,
      this.pullRequestCommentsStoreFile,
      pullRequestFiltersStoreFile
    );
  }

  /**
   * Refresh PR data from GitHub
   */
  async fetchPRs(options?: {
    startDate?: string;
    endDate?: string;
    forceRefresh?: boolean;
    incrementalUpdate?: boolean;
  }): Promise<PullRequestJsonResponse[]> {
    const fromCache = await this.pullRequestStoreFile.loadAll();

    if (options?.incrementalUpdate && fromCache.length > 0) {
      const latestDate = this.findLatestDate(fromCache.map((pr) => pr.updated_at));
      logger.info(`Incremental update: fetching PRs updated after ${latestDate}...`);
      const freshPRs = await this.githubPrsClient.fetchPRs({
        startDate: latestDate,
        endDate: options?.endDate,
      });
      const merged = this.mergePRs(fromCache, freshPRs);
      await this.pullRequestStoreFile.saveAll(merged);
      await this.refreshFilterOptions();
      return merged;
    }

    // Manual date range with merge
    if (
      (options?.startDate || options?.endDate) &&
      !options?.forceRefresh &&
      fromCache.length > 0
    ) {
      logger.info(
        `Fetching PRs for range [${options?.startDate || 'any'}..${options?.endDate || 'any'}] and merging with cache...`
      );
      const freshPRs = await this.githubPrsClient.fetchPRs({
        startDate: options?.startDate,
        endDate: options?.endDate,
      });
      const merged = this.mergePRs(fromCache, freshPRs);
      await this.pullRequestStoreFile.saveAll(merged);
      await this.refreshFilterOptions();
      return merged;
    }

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
    await this.refreshFilterOptions();

    return freshPRs;
  }

  private async refreshFilterOptions(): Promise<void> {
    await this.pullRequestFiltersRepository.refreshOptions();
  }

  private findLatestDate(dates: (string | undefined | null)[]): string {
    const valid = dates.filter((d): d is string => !!d).map((d) => new Date(d).getTime());
    if (valid.length === 0) return new Date(0).toISOString();
    return new Date(Math.max(...valid)).toISOString();
  }

  private mergePRs(
    existing: PullRequestJsonResponse[],
    incoming: PullRequestJsonResponse[]
  ): PullRequestJsonResponse[] {
    const map = new Map<string, PullRequestJsonResponse>();
    for (const pr of existing) map.set(pr.id, pr);
    for (const pr of incoming) map.set(pr.id, pr);
    return Array.from(map.values());
  }

  async fetchPRComments(
    prNumber: number,
    options?: { forceRefresh?: boolean; incrementalUpdate?: boolean }
  ): Promise<PullRequestCommentJsonResponse[]> {
    const fromCache = await this.pullRequestCommentsStoreFile.loadAll();
    const cachedCommentsForPR = fromCache.filter((comment) =>
      comment.pull_request_url.includes(`/pulls/${prNumber}`)
    );

    if (options?.incrementalUpdate && cachedCommentsForPR.length > 0) {
      const latestDate = this.findLatestCommentDate(cachedCommentsForPR);
      logger.info(
        `Incremental update for PR #${prNumber}: fetching comments updated after ${latestDate}...`
      );
      const freshComments = await this.githubPrsClient.fetchPRComments(prNumber);
      const filtered = freshComments.filter(
        (c) => !c.updated_at || new Date(c.updated_at) >= new Date(latestDate)
      );
      const merged = this.mergeCommentsByIdForPR(cachedCommentsForPR, filtered);
      const otherComments = fromCache.filter(
        (comment) => !comment.pull_request_url.includes(`/pulls/${prNumber}`)
      );
      const updatedComments = otherComments.concat(merged);
      await this.pullRequestCommentsStoreFile.saveAll(updatedComments);
      return merged;
    }

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

  private findLatestCommentDate(comments: PullRequestCommentJsonResponse[]): string {
    const dates = comments
      .map((c) => c.updated_at)
      .filter((d): d is string => !!d)
      .map((d) => new Date(d).getTime());
    if (dates.length === 0) return new Date(0).toISOString();
    return new Date(Math.max(...dates)).toISOString();
  }

  private mergeCommentsByIdForPR(
    existing: PullRequestCommentJsonResponse[],
    incoming: PullRequestCommentJsonResponse[]
  ): PullRequestCommentJsonResponse[] {
    const map = new Map<string, PullRequestCommentJsonResponse>();
    for (const comment of existing) map.set(String(comment.id), comment);
    for (const comment of incoming) map.set(String(comment.id), comment);
    return Array.from(map.values());
  }
}
