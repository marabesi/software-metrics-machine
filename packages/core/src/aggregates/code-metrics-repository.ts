import { logger } from '@utils/logger';
import { Commit } from '../../src/domain-types';
import { CommitTraverser } from '../../src/providers/git';
import { CodemaatAnalyzer } from '../../src/providers/codemaat';
import { PairingIndexService } from '../../src/domain/code/pairing-index';
import { FileSystemRepository } from '../../src/infrastructure/repository';

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
    private commitTraverser: CommitTraverser,
    private codemaatAnalyzer: CodemaatAnalyzer,
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

    // Save to cache
    // if (result.commits.length > 0) {
    //   await this.commitCache.saveAll(
    //     [
    //       {totalAnalyzedCommits: result.totalAnalyzedCommits, pairedCommits: result.pairedCommits, commits: result.commits}
    //     ]
    //     // new Map(result.commits.map((c, idx) => [`commit-${idx}`, c]))
    //   );
    // }

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
