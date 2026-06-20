import { Commit } from '../domain-types';
import { PairingService } from '../domain/code/pairing-service';
import { Configuration, FileSystemRepository } from '../infrastructure';
import { TimeZoneProvider } from '../infrastructure/timezone-provider';
import { Logger } from '@smmachine/utils';

export class PairingFactory {
  static create(
    configuration: Configuration,
    logger: Logger
  ): PairingService {
    const commitRepository = new FileSystemRepository<Commit>(
      `${configuration.getGitPath()}/commits.json`,
      logger
    );
    const tz = new TimeZoneProvider(configuration.timezone);
    return new PairingService(commitRepository, tz, logger);
  }
}
