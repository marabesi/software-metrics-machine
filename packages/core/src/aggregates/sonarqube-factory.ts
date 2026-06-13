import { SonarqubeComponentMeasure } from 'src';
import { Configuration, FileSystemRepository } from '../infrastructure';
import { SonarqubeRepository } from './sonarqube-repository';
import { SonarqubeComponentTreeMeasure, TimestampedStore } from '../providers/sonarqube/types';

export class SonarqubeFactory {
  static create(configuration: Configuration): SonarqubeRepository {
    const cacheDir = configuration.getSonarqubePath();
    const cache = new FileSystemRepository<TimestampedStore<SonarqubeComponentMeasure>>(
      `${cacheDir}/measures.json`
    );
    const cacheComponentTree = new FileSystemRepository<
      TimestampedStore<SonarqubeComponentTreeMeasure[]>
    >(`${cacheDir}/component-tree.json`);

    return new SonarqubeRepository(cache, cacheComponentTree);
  }
}
