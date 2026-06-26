import { Commit } from '../domain-types';
import { PairingService } from '../domain/code/pairing-service';
import { Configuration, RepositoryFactory } from '../infrastructure';
import { TimeZoneProvider } from '../infrastructure/timezone-provider';
import { Logger } from '@smmachine/utils';

export class PairingFactory {
  static create(
    configuration: Configuration,
    logger: Logger,
    timeZoneProvider: TimeZoneProvider
  ): PairingService {
    const commitRepository = RepositoryFactory.create<Commit>(
      `${configuration.getGitPath()}/commits.json`,
      logger,
      configuration
    );
    return new PairingService(commitRepository, timeZoneProvider, logger);
  }
}
