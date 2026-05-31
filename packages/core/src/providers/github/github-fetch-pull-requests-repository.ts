import { logger } from '@smmachine/utils';
import { FileSystemRepository } from '../../infrastructure/repository';
import { PRDetails } from '../../domain-types';
import { type IGithubPrsClient } from '.';

export interface IPullRequestsRepository {}

export class GitHubPullRequestsFetchRepository implements IPullRequestsRepository {
  private cache: FileSystemRepository<PRDetails>;

  constructor(
    private githubPrsClient: IGithubPrsClient,
    cacheDir: string
  ) {
    this.cache = new FileSystemRepository<PRDetails>(`${cacheDir}/prs.json`);
  }

  /**
   * Refresh PR data from GitHub
   */
  async fetchPRs(options?: {
    startDate?: string;
    endDate?: string;
    forceRefresh?: boolean;
  }): Promise<PRDetails[]> {
    const fromCache = await this.cache.loadAll();

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
    await this.cache.saveAll(freshPRs);

    return freshPRs;
  }
}
