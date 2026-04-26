import { logger } from '@smm/utils';
import { FileSystemRepository } from '../../src/infrastructure/repository';
import { PRDetails } from '../domain-types';
import { type IGithubPrsClient } from '../../src/providers/github';
import { PRsService } from '../../src/domain/prs';

export interface IPullRequestsRepository {
  getPRMetrics(filters?: any): Promise<any>;
  getPRsByMonth(filters?: any): Promise<any>;
  getPRsByWeek(filters?: any): Promise<any>;
}

/**
 * Combines GitHub provider with PR domain logic
 * Handles:
 * - Fetching PRs from GitHub
 * - Caching locally
 * - Computing PR metrics (lead time, etc.)
 */
export class PullRequestsRepository implements IPullRequestsRepository {
  private prService: PRsService;
  private cache: FileSystemRepository<PRDetails>;

  constructor(
    private githubPrsClient: IGithubPrsClient,
    cacheDir: string
  ) {
    this.cache = new FileSystemRepository<PRDetails>(`${cacheDir}/prs.json`);
    this.prService = new PRsService(this.cache);
  }

  /**
   * Refresh PR data from GitHub
   */
  async refreshPRs(options?: {
    startDate?: string;
    endDate?: string;
    forceRefresh?: boolean;
  }): Promise<PRDetails[]> {
    const fromCache = await this.cache.loadAll();

    if (!options?.forceRefresh && fromCache.length > 0) {
      logger.info(`Using cached PRs: ${fromCache.length} records`);
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

  /**
   * Get PR metrics
   */
  async getPRMetrics(filters?: any): Promise<any> {
    await this.refreshPRs(filters);
    return this.prService.getMetrics(filters);
  }

  /**
   * Get PR metrics by month
   */
  async getPRsByMonth(filters?: any): Promise<any> {
    await this.refreshPRs(filters);
    return this.prService.getMetricsByMonth(filters);
  }

  /**
   * Get PR metrics by week
   */
  async getPRsByWeek(filters?: any): Promise<any> {
    await this.refreshPRs(filters);
    return this.prService.getMetricsByWeek(filters);
  }
}
