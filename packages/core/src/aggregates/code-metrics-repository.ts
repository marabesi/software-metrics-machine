import { logger } from '@smm/utils';
import { Commit } from '../domain-types';
import { type ICommitTraverser } from '../providers/git';
import { type ICodemaatAnalyzer } from '../providers/codemaat';
import { PairingIndexService } from '../domain/code/pairing-index';
import { FileSystemRepository } from '../infrastructure/repository';

export interface ICodeMetricsRepository {
  getPairingIndex(options?: any): Promise<any>;
  getCodeChurn(options?: any): Promise<any>;
  getFileCoupling(options?: any): Promise<any>;
}

/**
 * Combines Git and CodeMaat providers with code metrics domain logic
 * Handles:
 * - Analyzing commits from git repository
 * - Calculating pairing index
 * - Loading code churn metrics
 * - Analyzing file coupling
 */
export class CodeMetricsRepository implements ICodeMetricsRepository {
  private pairingService: PairingIndexService;
  private commitCache: FileSystemRepository<Commit>;

  constructor(
    private commitTraverser: ICommitTraverser,
    private codemaatAnalyzer: ICodemaatAnalyzer,
    cacheDir: string
  ) {
    this.commitCache = new FileSystemRepository<Commit>(`${cacheDir}/commits.json`);
    this.pairingService = new PairingIndexService(this.commitCache);
  }

  /**
   * Refresh commits from local git repository
   */
  async refreshCommits(options?: {
    startDate?: string;
    endDate?: string;
    forceRefresh?: boolean;
  }): Promise<Commit[]> {
    const fromCache = await this.commitCache.loadAll();

    if (!options?.forceRefresh && fromCache.length > 0) {
      logger.info(`Using cached commits: ${fromCache.length} records`);
      return fromCache;
    }

    logger.info('Analyzing commits from git repository...');
    const result = await this.commitTraverser.traverseCommits({
      startDate: options?.startDate,
      endDate: options?.endDate,
    });

    // Persist fetched commits to disk for reuse by subsequent commands.
    await this.commitCache.saveAll(result.commits);

    return result.commits;
  }

  /**
   * Get pairing index (co-author percentage)
   */
  async getPairingIndex(options?: any): Promise<any> {
    await this.refreshCommits(options);
    return this.pairingService.getPairingIndex({
      selectedAuthors: options?.selectedAuthors,
      startDate: options?.startDate,
      endDate: options?.endDate,
      includeAuthors: options?.includeAuthors,
      excludeAuthors: options?.excludeAuthors,
    });
  }

  /**
   * Get code churn metrics
   */
  async getCodeChurn(options?: any): Promise<any> {
    logger.info('Fetching code churn from CodeMaat...');
    return this.codemaatAnalyzer.getCodeChurn({
      startDate: options?.startDate,
      endDate: options?.endDate,
    });
  }

  /**
   * Get file coupling metrics
   */
  async getFileCoupling(options?: any): Promise<any> {
    logger.info('Fetching file coupling from CodeMaat...');
    return this.codemaatAnalyzer.getFileCoupling({
      ignorePatterns: options?.ignorePatterns,
    });
  }
}
