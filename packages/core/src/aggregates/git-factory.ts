import { CommitTraverser } from '../';
import { Commit } from '../domain-types';
import { Configuration, FileSystemRepository } from '../infrastructure';
import { GitFetchRepository } from '../providers/git/git-fetch-repository';

export class GitFactory {
  static create(configuration: Configuration): GitFetchRepository {
    const commitTraverser = new CommitTraverser(configuration.gitRepositoryLocation);
    const commitRepository = new FileSystemRepository<Commit>(
      `${configuration.getGitPath()}/commits.json`
    );
    return new GitFetchRepository(commitTraverser, commitRepository);
  }
}
