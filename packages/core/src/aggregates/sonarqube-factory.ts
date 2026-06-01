import { SonarqubeComponentMeasure } from 'src';
import { Configuration, FileSystemRepository } from '../infrastructure';
import { SonarqubeRepository } from './sonarqube-repository';
import { SonarqubeComponentTreeMeasure } from 'src/providers/sonarqube/types';

export class SonarqubeFactory {
  static create(configuration: Configuration): SonarqubeRepository {
    const cacheDir = configuration.getSonarqubePath();
    const cache = new FileSystemRepository<SonarqubeComponentMeasure[]>(
      `${cacheDir}/measures.json`
    );
    const cacheComponentTree = new FileSystemRepository<SonarqubeComponentTreeMeasure[]>(
      `${cacheDir}/component-tree.json`
    );

    return new SonarqubeRepository(cache, cacheComponentTree);
  }
}
