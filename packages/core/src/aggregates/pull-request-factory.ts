import { Configuration, FileSystemRepository } from '../infrastructure';
import { PullRequestsRepository } from './pull-requests-repository';
import {
  PullRequestCommentJsonResponse,
  PullRequestJsonResponse,
} from 'src/providers/github/github-response-types';

export class PullRequestFactory {
  static create(config: Configuration): PullRequestsRepository {
    const cache = new FileSystemRepository<PullRequestJsonResponse>(
      `${config.getPathFromGitProvider()}/prs.json`
    );
    const pullRequestCommentsStoreFile = new FileSystemRepository<PullRequestCommentJsonResponse>(
      `${config.getPathFromGitProvider()}/pr-comments.json`
    );
    return new PullRequestsRepository(cache, pullRequestCommentsStoreFile);
  }
}
