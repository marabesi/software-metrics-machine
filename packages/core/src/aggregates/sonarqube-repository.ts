import { SonarqubeComponentMeasure } from '..';
import { IRepository } from '../infrastructure';
import {
  SonarqubeComponentTreeMeasure,
  SonarqubeMeasure,
  TimestampedEntry,
  TimestampedStore,
  extractLatestData,
} from '../providers/sonarqube/types';

type StoredMeasure = {
  metric?: string;
  key?: string;
  name?: string;
  value?: string | number;
};

export class SonarqubeRepository {
  constructor(
    private measurementRepository: IRepository<TimestampedStore<SonarqubeComponentMeasure>>,
    private componentTreeRepository: IRepository<TimestampedStore<SonarqubeComponentTreeMeasure[]>>
  ) {}

  async loadAll(_options?: unknown): Promise<SonarqubeComponentMeasure | null> {
    const store = await this.measurementRepository.load();
    return extractLatestData(store);
  }

  async loadMeasurements(_options?: unknown): Promise<SonarqubeMeasure[]> {
    const data = await this.loadAll();
    if (!data) {
      return [];
    }
    return data.measures.map((m: StoredMeasure) => ({
      metric: m.metric ?? m.key ?? m.name ?? '',
      value: String(m.value ?? ''),
    }));
  }

  async loadAllMeasurementEntries(): Promise<TimestampedEntry<SonarqubeMeasure[]>[]> {
    const store = await this.measurementRepository.load();
    if (!store) return [];

    const entries = Array.isArray(store.entries) ? store.entries : [];
    return entries.map((entry: TimestampedEntry<SonarqubeComponentMeasure>) => ({
      fetchedAt: entry.fetchedAt,
      data: (entry.data?.measures || []).map((m: StoredMeasure) => ({
        metric: m.metric ?? m.key ?? m.name ?? '',
        value: String(m.value ?? ''),
      })),
    }));
  }

  async loadComponentTree(_options?: unknown): Promise<SonarqubeComponentTreeMeasure[]> {
    const store = await this.componentTreeRepository.load();
    return extractLatestData(store) || [];
  }

  async loadAllComponentTreeEntries(): Promise<
    TimestampedEntry<SonarqubeComponentTreeMeasure[]>[]
  > {
    const store = await this.componentTreeRepository.load();
    if (!store) return [];

    const entries = Array.isArray(store.entries) ? store.entries : [];
    return entries.map((entry: TimestampedEntry<SonarqubeComponentTreeMeasure[]>) => ({
      fetchedAt: entry.fetchedAt,
      data: Array.isArray(entry.data) ? entry.data : [],
    }));
  }
}
