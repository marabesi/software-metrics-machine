import { logger } from '@smmachine/utils';
import { ICommitTraverser, IRepository } from 'src';
import { Commit } from 'src/domain-types';

export class GitFetchRepository {
  constructor(
    private commitTraverser: ICommitTraverser,
    private commitCache: IRepository<Commit>
  ) {}

  async fetchCommits(options?: {
    startDate?: string;
    endDate?: string;
    forceRefresh?: boolean;
    maxBuffer?: number;
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
      maxBuffer: options?.maxBuffer,
    });

    await this.commitCache.saveAll(result.commits);

    return result.commits;
  }
}
