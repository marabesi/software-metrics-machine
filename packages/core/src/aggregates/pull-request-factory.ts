import { Configuration, FileSystemRepository } from '../infrastructure';
import { PullRequestsRepository } from './pull-requests-repository';
import {
  PullRequestCommentJsonResponse,
  PullRequestJsonResponse,
} from 'src/providers/github/github-response-types';
import {
  PullRequestFilterOptions,
  PullRequestFiltersRepository,
} from './pull-request-filters-repository';

export class PullRequestFactory {
  static create(config: Configuration): PullRequestsRepository {
    const repositories = this.createRepositories(config);
    return new PullRequestsRepository(
      repositories.cache,
      repositories.pullRequestCommentsStoreFile
    );
  }

  static createFilters(config: Configuration): PullRequestFiltersRepository {
    const repositories = this.createRepositories(config);
    return new PullRequestFiltersRepository(
      repositories.cache,
      repositories.pullRequestCommentsStoreFile,
      repositories.pullRequestFiltersStoreFile
    );
  }

  private static createRepositories(config: Configuration) {
    const cache = new FileSystemRepository<PullRequestJsonResponse>(
      `${config.getPathFromGitProvider()}/prs.json`
    );
    const pullRequestCommentsStoreFile = new FileSystemRepository<PullRequestCommentJsonResponse>(
      `${config.getPathFromGitProvider()}/pr-comments.json`
    );
    const pullRequestFiltersStoreFile = new FileSystemRepository<PullRequestFilterOptions>(
      `${config.getPathFromGitProvider()}/pull-request-filter-options.json`
    );

    return {
      cache,
      pullRequestCommentsStoreFile,
      pullRequestFiltersStoreFile,
    };
  }
}
