import { SonarqubeComponentMeasure } from 'src';
import { IRepository } from '../infrastructure';
import { SonarqubeComponentTreeMeasure, SonarqubeMeasure } from '../providers/sonarqube/types';

export class SonarqubeRepository {
  constructor(
    private measurementRepository: IRepository<SonarqubeComponentMeasure>,
    private componentTreeRepository: IRepository<SonarqubeComponentTreeMeasure[]>
  ) {}

  async loadAll(options?: any): Promise<SonarqubeComponentMeasure | null> {
    return await this.measurementRepository.load();
  }

  async loadMeasurements(options?: any): Promise<SonarqubeMeasure[]> {
    const fromDisk = await this.measurementRepository.load();
    if (!fromDisk) {
      return [];
    }
    return (fromDisk.measures as any[]).map((m) => ({
      metric: m.metric ?? m.key ?? m.name ?? '',
      value: String(m.value ?? ''),
    }));
  }

  async loadComponentTree(options?: any): Promise<SonarqubeComponentTreeMeasure[]> {
    const fromDisk = await this.componentTreeRepository.load();
    return fromDisk || [];
  }
}
