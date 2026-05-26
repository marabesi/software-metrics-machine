import { Commit } from '../domain-types';
import { PairingService } from '../domain/code/pairing-service';
import { Configuration, FileSystemRepository } from '../infrastructure';

export class PairingFactory {
  static create(configuration: Configuration): PairingService {
    const commitRepository = new FileSystemRepository<Commit>(
      `${configuration.getGitPath()}/commits.json`
    );
    return new PairingService(commitRepository);
  }
}
