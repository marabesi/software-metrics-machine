import { Configuration, RepositoryFactory } from '../infrastructure';
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
    logger: Logger,
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
    logger: Logger,
  ): PullRequestFiltersRepository {
    const repositories = this.createRepositories(config, logger);
    return new PullRequestFiltersRepository(
      repositories.cache,
      repositories.pullRequestCommentsStoreFile,
      repositories.pullRequestFiltersStoreFile
    );
  }

  private static createRepositories(
    config: Configuration,
    logger: Logger,
  ) {
    const cache = RepositoryFactory.create<PullRequestJsonResponse>(
      `${config.getPathFromGitProvider()}/prs.json`,
      logger,
      config
    );
    const pullRequestCommentsStoreFile = RepositoryFactory.create<PullRequestCommentJsonResponse>(
      `${config.getPathFromGitProvider()}/pr-comments.json`,
      logger,
      config
    );
    const pullRequestFiltersStoreFile = RepositoryFactory.create<PullRequestFilterOptions>(
      `${config.getPathFromGitProvider()}/pull-request-filter-options.json`,
      logger,
      config
    );

    return {
      cache,
      pullRequestCommentsStoreFile,
      pullRequestFiltersStoreFile,
    };
  }
}
