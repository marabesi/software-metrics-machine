import { SonarqubeComponentMeasure } from 'src';
import { Configuration, FileSystemRepository } from '../infrastructure';
import { SonarqubeRepository } from './sonarqube-repository';
import { SonarqubeComponentTreeMeasure, TimestampedStore } from '../providers/sonarqube/types';
import { Logger } from '@smmachine/utils';

export class SonarqubeFactory {
  static create(configuration: Configuration, logger: Logger): SonarqubeRepository {
    const cacheDir = configuration.getSonarqubePath();
    const cache = new FileSystemRepository<TimestampedStore<SonarqubeComponentMeasure>>(
      `${cacheDir}/measures.json`,
      logger
    );
    const cacheComponentTree = new FileSystemRepository<
      TimestampedStore<SonarqubeComponentTreeMeasure[]>
    >(`${cacheDir}/component-tree.json`, logger);

    return new SonarqubeRepository(cache, cacheComponentTree);
  }
}
