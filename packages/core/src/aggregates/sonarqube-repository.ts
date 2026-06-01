import { SonarqubeComponentMeasure } from 'src';
import { IRepository } from '../infrastructure';
import { SonarqubeComponentTreeMeasure } from 'src/providers/sonarqube/types';

export class SonarqubeRepository {
  constructor(
    private measurementRepository: IRepository<SonarqubeComponentMeasure[]>,
    private componentTreeRepository: IRepository<SonarqubeComponentTreeMeasure[]>
  ) {}

  async loadAll(options?: any): Promise<SonarqubeComponentMeasure[]> {
    const fromDisk = await this.measurementRepository.load();
    return fromDisk || [];
  }

  async loadMeasurements(options?: any): Promise<SonarqubeComponentMeasure[]> {
    const fromDisk = await this.measurementRepository.load();
    return fromDisk || [];
  }

  async loadComponentTree(options?: any): Promise<SonarqubeComponentTreeMeasure[]> {
    const fromDisk = await this.componentTreeRepository.load();
    return fromDisk || [];
  }
}
