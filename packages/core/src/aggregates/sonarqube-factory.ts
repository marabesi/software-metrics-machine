import { SonarqubeComponentMeasure } from 'src';
import { Configuration, RepositoryFactory } from '../infrastructure';
import { SonarqubeRepository } from './sonarqube-repository';
import {
  CodeMetric,
  SonarqubeComponentTreeMeasure,
  TimestampedStore,
} from '../providers/sonarqube/types';
import { Logger } from '@smmachine/utils';

export class SonarqubeFactory {
  static create(configuration: Configuration, logger: Logger): SonarqubeRepository {
    const cacheDir = configuration.getSonarqubePath();
    const cache = RepositoryFactory.create<TimestampedStore<SonarqubeComponentMeasure>>(
      `${cacheDir}/measures.json`,
      logger,
      configuration
    );
    const cacheComponentTree = RepositoryFactory.create<
      TimestampedStore<SonarqubeComponentTreeMeasure[]>
    >(`${cacheDir}/component-tree.json`, logger, configuration);
    const cacheHistorical = RepositoryFactory.create<TimestampedStore<CodeMetric[]>>(
      `${cacheDir}/historical-measures.json`,
      logger,
      configuration
    );

    return new SonarqubeRepository(cache, cacheComponentTree, cacheHistorical);
  }
}
