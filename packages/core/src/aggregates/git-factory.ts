import { CommitTraverser } from '../';
import { Commit } from '../domain-types';
import { Configuration, FileSystemRepository } from '../infrastructure';
import { GitFetchRepository } from '../providers/git/git-fetch-repository';
import { Logger } from '@smmachine/utils';

export class GitFactory {
  static create(
    configuration: Configuration,
    logger: Logger
  ): GitFetchRepository {
    const commitTraverser = new CommitTraverser(configuration.gitRepositoryLocation, logger);
    const commitRepository = new FileSystemRepository<Commit>(
      `${configuration.getGitPath()}/commits.json`,
      logger
    );
    return new GitFetchRepository(commitTraverser, commitRepository, logger);
  }
}
