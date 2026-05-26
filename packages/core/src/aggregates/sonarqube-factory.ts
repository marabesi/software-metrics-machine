import { SonarqubeComponentMeasure } from 'src';
import { Configuration, FileSystemRepository } from '../infrastructure';
import { SonarqubeRepository } from './sonarqube-repository';

export class SonarqubeFactory {
  static create(configuration: Configuration): SonarqubeRepository {
    const cacheDir = configuration.getSonarqubePath();
    const cache = new FileSystemRepository<any>(`${cacheDir}/measures.json`);
    const cacheComponentTree = new FileSystemRepository<SonarqubeComponentMeasure[]>(
      `${cacheDir}/component-tree.json`
    );

    return new SonarqubeRepository(cache, cacheComponentTree);
  }
}
