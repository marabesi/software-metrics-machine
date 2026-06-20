import { Logger } from '@smmachine/utils';
import { IRepository } from './repository';
import { JsonFileSystemRepository } from './repository';
import { Configuration } from './configuration';

/**
 * Factory for creating IRepository<T> instances based on the configured storage type.
 *
 * Usage:
 *   const repo = RepositoryFactory.create<MyType>('/path/to/file.json', logger, config);
 */
export class RepositoryFactory {
  /**
   * Create a repository instance for the given configuration.
   *
   * @param filePath - Path to the storage location (file path for json, db path for sqlite)
   * @param logger - Logger instance
   * @param config - Configuration containing internal.storageType
   * @returns An IRepository<T> implementation
   */
  static create<T>(
    filePath: string,
    logger: Logger,
    config: Configuration
  ): IRepository<T> {
    const storageType = config.internal?.storageType ?? 'json';
    switch (storageType) {
      case 'json':
        return new JsonFileSystemRepository<T>(filePath, logger);
      case 'sqlite':
        throw new Error(
          'SQLite storage is configured, but the SQLite repository implementation is not available yet. Supported storage types: json'
        );
      default:
        throw new Error(
          `Unknown storage type: ${storageType}. Supported types: json`
        );
    }
  }
}
