import { FileSystemRepository } from '../infrastructure/repository';
import { PRDetails } from '../domain-types';

export class PullRequestsRepository {
  constructor(
    private cache: FileSystemRepository<PRDetails>
  ) {
  }

  async loadPrsWithFilters(options?: {
    startDate?: string;
    endDate?: string;
  }): Promise<PRDetails[]> {
    const fromCache = await this.cache.loadAll();

    return fromCache;
  }
}
