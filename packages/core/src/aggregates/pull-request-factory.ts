import { PRDetails } from 'src/domain-types';
import { Configuration, FileSystemRepository } from '../infrastructure';
import { PullRequestsRepository } from './pull-requests-repository';

export class PullRequestFactory {
  static create(config: Configuration): PullRequestsRepository {
    const cache = new FileSystemRepository<PRDetails>(`${config.getPipelinePath()}/prs.json`);
    return new PullRequestsRepository(cache);
  }
}
