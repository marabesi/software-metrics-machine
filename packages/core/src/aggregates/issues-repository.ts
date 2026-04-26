import { logger } from '@smm/utils';
import { FileSystemRepository } from '../../src/infrastructure/repository';
import { Issue } from '../domain-types';
import { JiraIssuesClient } from '../../src/providers/jira';

export interface IIssuesRepository {
  getIssues(filters?: any): Promise<Issue[]>;
  getIssueChanges(issueKey: string): Promise<any[]>;
  getIssueComments(issueKey: string): Promise<any[]>;
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
    private jiraClient: JiraIssuesClient,
    cacheDir: string
  ) {
    this.cache = new FileSystemRepository<Issue>(`${cacheDir}/issues.json`);
  }

  /**
   * Refresh issue data from Jira
   */
  async refreshIssues(options?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    forceRefresh?: boolean;
  }): Promise<Issue[]> {
    const fromCache = await this.cache.loadAll();

    if (!options?.forceRefresh && fromCache.length > 0) {
      logger.info(`Using cached issues: ${fromCache.length} records`);
      return fromCache;
    }

    logger.info('Fetching issues from Jira...');
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
  async getIssues(filters?: any): Promise<Issue[]> {
    return this.refreshIssues(filters);
  }

  /**
   * Get issue changes/history
   */
  async getIssueChanges(issueKey: string): Promise<any[]> {
    logger.info(`Fetching changes for issue ${issueKey}...`);
    return this.jiraClient.fetchIssueChanges(issueKey);
  }

  /**
   * Get issue comments
   */
  async getIssueComments(issueKey: string): Promise<any[]> {
    logger.info(`Fetching comments for issue ${issueKey}...`);
    return this.jiraClient.fetchIssueComments(issueKey);
  }
}
