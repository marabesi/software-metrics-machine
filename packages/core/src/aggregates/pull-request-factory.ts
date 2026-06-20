import { Configuration, FileSystemRepository } from '../infrastructure';
import { TimeZoneProvider } from '../infrastructure/timezone-provider';
import { PullRequestsRepository } from './pull-requests-repository';
import {
  PullRequestCommentJsonResponse,
  PullRequestJsonResponse,
} from 'src/providers/github/github-response-types';
import {
  PullRequestFilterOptions,
  PullRequestFiltersRepository,
} from './pull-request-filters-repository';
import { Logger } from '@smmachine/utils';

export class PullRequestFactory {
  static create(
    config: Configuration,
    logger: Logger
  ): PullRequestsRepository {
    const repositories = this.createRepositories(config, logger);
    const tz = new TimeZoneProvider(config.timezone);
    return new PullRequestsRepository(
      repositories.cache,
      repositories.pullRequestCommentsStoreFile,
      tz
    );
  }

  static createFilters(
    config: Configuration,
    logger: Logger
  ): PullRequestFiltersRepository {
    const repositories = this.createRepositories(config, logger);
    return new PullRequestFiltersRepository(
      repositories.cache,
      repositories.pullRequestCommentsStoreFile,
      repositories.pullRequestFiltersStoreFile
    );
  }

  private static createRepositories(config: Configuration, logger: Logger) {
    const cache = new FileSystemRepository<PullRequestJsonResponse>(
      `${config.getPathFromGitProvider()}/prs.json`,
      logger
    );
    const pullRequestCommentsStoreFile = new FileSystemRepository<PullRequestCommentJsonResponse>(
      `${config.getPathFromGitProvider()}/pr-comments.json`,
      logger
    );
    const pullRequestFiltersStoreFile = new FileSystemRepository<PullRequestFilterOptions>(
      `${config.getPathFromGitProvider()}/pull-request-filter-options.json`,
      logger
    );

    return {
      cache,
      pullRequestCommentsStoreFile,
      pullRequestFiltersStoreFile,
    };
  }
}
