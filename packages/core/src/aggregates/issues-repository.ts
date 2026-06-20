import { Logger } from '@smmachine/utils';
import { FileSystemRepository } from '../infrastructure/repository';
import { Issue } from '../domain-types';
import { type IJiraIssuesClient } from '../providers/jira';

export interface IssueFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  forceRefresh?: boolean;
  incrementalUpdate?: boolean;
}

export interface IIssuesRepository {
  getIssues(filters?: IssueFilters): Promise<Issue[]>;
  getIssueChanges(issueKey: string): Promise<unknown[]>;
  getIssueComments(issueKey: string): Promise<unknown[]>;
}

/**
 * Combines Jira provider with issue management logic
 * Handles:
 * - Fetching issues from Jira
 * - Caching locally
 * - Retrieving issue history
 * - Accessing issue comments
 */
export class IssuesRepository implements IIssuesRepository {
  private cache: FileSystemRepository<Issue>;

  constructor(
    private jiraClient: IJiraIssuesClient,
    cacheDir: string,
    private logger: Logger
  ) {
    this.cache = new FileSystemRepository<Issue>(`${cacheDir}/issues.json`, logger);
  }

  /**
   * Refresh issue data from Jira
   */
  async refreshIssues(options?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    forceRefresh?: boolean;
    incrementalUpdate?: boolean;
  }): Promise<Issue[]> {
    const fromCache = await this.cache.loadAll();

    if (options?.incrementalUpdate && fromCache.length > 0) {
      const latestDate = this.findLatestDate(fromCache.map((i) => i.createdAt));
      this.logger.info(`Incremental update: fetching Jira issues created after ${latestDate}...`);
      const freshIssues = await this.jiraClient.fetchIssues({
        startDate: latestDate,
        endDate: options?.endDate,
        status: options?.status,
      });
      const merged = this.mergeIssuesById(fromCache, freshIssues);
      await this.cache.saveAll(merged);
      return merged;
    }

    // Manual date range with merge
    if (
      (options?.startDate || options?.endDate) &&
      !options?.forceRefresh &&
      fromCache.length > 0
    ) {
      this.logger.info(
        `Fetching Jira issues for range [${options?.startDate || 'any'}..${options?.endDate || 'any'}] and merging with cache...`
      );
      const freshIssues = await this.jiraClient.fetchIssues({
        startDate: options?.startDate,
        endDate: options?.endDate,
        status: options?.status,
      });
      const merged = this.mergeIssuesById(fromCache, freshIssues);
      await this.cache.saveAll(merged);
      return merged;
    }

    if (!options?.forceRefresh && fromCache.length > 0) {
      this.logger.info(`Using cached issues: ${fromCache.length} records`);
      return fromCache;
    }

    this.logger.info('Fetching issues from Jira...');
    const freshIssues = await this.jiraClient.fetchIssues({
      startDate: options?.startDate,
      endDate: options?.endDate,
      status: options?.status,
    });

    await this.cache.saveAll(freshIssues);

    return freshIssues;
  }

  /**
   * Get issues with optional filters
   */
  async getIssues(filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    forceRefresh?: boolean;
    incrementalUpdate?: boolean;
  }): Promise<Issue[]> {
    return this.refreshIssues(filters);
  }

  private findLatestDate(dates: (string | undefined | null)[]): string {
    const valid = dates.filter((d): d is string => !!d).map((d) => new Date(d).getTime());
    if (valid.length === 0) return new Date(0).toISOString();
    return new Date(Math.max(...valid)).toISOString();
  }

  private mergeIssuesById(existing: Issue[], incoming: Issue[]): Issue[] {
    const map = new Map<string, Issue>();
    for (const issue of existing) map.set(issue.id, issue);
    for (const issue of incoming) map.set(issue.id, issue);
    return Array.from(map.values());
  }

  /**
   * Get issue changes/history
   */
  async getIssueChanges(issueKey: string): Promise<unknown[]> {
    this.logger.info(`Fetching changes for issue ${issueKey}...`);
    return this.jiraClient.fetchIssueChanges(issueKey);
  }

  /**
   * Get issue comments
   */
  async getIssueComments(issueKey: string): Promise<unknown[]> {
    this.logger.info(`Fetching comments for issue ${issueKey}...`);
    return this.jiraClient.fetchIssueComments(issueKey);
  }
}
