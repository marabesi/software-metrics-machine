import { SonarqubeComponentMeasure } from '..';
import path from 'path';
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

export type SonarqubeMeasureFilters = {
  measures?: string | string[];
};

export type SonarqubeComponentTreeFilters = {
  component?: string;
  depth?: number;
  metrics?: string | string[];
  ignore_files?: string | string[];
  include_files?: string | string[];
  remove_folders?: boolean;
};

export class SonarqubeRepository {
  constructor(
    private measurementRepository: IRepository<TimestampedStore<SonarqubeComponentMeasure>>,
    private componentTreeRepository: IRepository<TimestampedStore<SonarqubeComponentTreeMeasure[]>>
  ) {}

  async loadAll(options?: SonarqubeMeasureFilters | string[]): Promise<SonarqubeComponentMeasure | null> {
    const store = await this.measurementRepository.load();
    return this.filterComponentMeasure(extractLatestData(store), options);
  }

  async loadMeasurements(options?: SonarqubeMeasureFilters | string[]): Promise<SonarqubeMeasure[]> {
    const data = await this.loadAll(options);
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

  async loadComponentTree(
    options?: SonarqubeComponentTreeFilters
  ): Promise<SonarqubeComponentTreeMeasure[]> {
    const store = await this.componentTreeRepository.load();
    return this.filterComponentTree(extractLatestData(store) || [], options);
  }

  async loadAllComponentTreeEntries(
    options?: SonarqubeComponentTreeFilters
  ): Promise<
    TimestampedEntry<SonarqubeComponentTreeMeasure[]>[]
  > {
    const store = await this.componentTreeRepository.load();
    if (!store) return [];

    const entries = Array.isArray(store.entries) ? store.entries : [];
    return entries.map((entry: TimestampedEntry<SonarqubeComponentTreeMeasure[]>) => ({
      fetchedAt: entry.fetchedAt,
      data: this.filterComponentTree(Array.isArray(entry.data) ? entry.data : [], options),
    }));
  }

  private filterComponentMeasure(
    measure: SonarqubeComponentMeasure | null,
    options?: SonarqubeMeasureFilters | string[]
  ): SonarqubeComponentMeasure | null {
    if (!measure) {
      return null;
    }

    const measures = this.normalizeMeasures(options);
    if (measures.length === 0) {
      return measure;
    }

    return {
      ...measure,
      measures: (measure.measures || []).filter((item) => measures.includes(item.metric)),
    };
  }

  private normalizeMeasures(options?: SonarqubeMeasureFilters | string[]): string[] {
    const value = Array.isArray(options) ? options : options?.measures;
    return this.normalizeList(value);
  }

  private filterComponentTree(
    components: SonarqubeComponentTreeMeasure[],
    options?: SonarqubeComponentTreeFilters
  ): SonarqubeComponentTreeMeasure[] {
    const ignorePatterns = this.normalizeList(options?.ignore_files);
    const includePatterns = this.normalizeList(options?.include_files);
    const metricFilters = this.normalizeList(options?.metrics);
    const removeFolders = options?.remove_folders || false;

    return components
      .filter((component) => {
        const componentType = component.type || component.qualifier;
        if (removeFolders && (componentType === 'DIR' || componentType === 'TRK')) {
          return false;
        }

        const key = component.key || '';
        const name = component.name || '';

        if (includePatterns.length > 0) {
          const matchesInclude = includePatterns.some(
            (pattern) => this.matchesPattern(key, pattern) || this.matchesPattern(name, pattern)
          );
          if (!matchesInclude) {
            return false;
          }
        }

        return !ignorePatterns.some(
          (pattern) => this.matchesPattern(key, pattern) || this.matchesPattern(name, pattern)
        );
      })
      .map((component) => {
        if (metricFilters.length === 0) {
          return component;
        }

        return {
          ...component,
          measures: (component.measures || []).filter((measure) =>
            metricFilters.includes(measure.key)
          ),
        };
      });
  }

  private normalizeList(value?: string | string[]): string[] {
    if (!value) {
      return [];
    }

    const values = Array.isArray(value) ? value : [value];
    return values
      .flatMap((item) => String(item).split(','))
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  private matchesPattern(entity: string, pattern: string): boolean {
    if (!entity) {
      return false;
    }

    const normalizedEntity = entity.toLowerCase().replace(/\\/g, '/');
    const normalizedPattern = pattern.toLowerCase();

    if (!this.containsGlobToken(normalizedPattern)) {
      return normalizedEntity.includes(normalizedPattern);
    }

    const regex = this.globToRegExp(normalizedPattern);

    if (!normalizedPattern.includes('/')) {
      const basename = path.posix.basename(normalizedEntity);
      return regex.test(basename);
    }

    return regex.test(normalizedEntity);
  }

  private containsGlobToken(value: string): boolean {
    return /[*?[\]]/.test(value);
  }

  private globToRegExp(globPattern: string): RegExp {
    let regexPattern = '^';

    for (let index = 0; index < globPattern.length; index += 1) {
      const current = globPattern[index];
      const next = globPattern[index + 1];

      if (current === '*' && next === '*') {
        regexPattern += '.*';
        index += 1;
        continue;
      }

      if (current === '*') {
        regexPattern += '[^/]*';
        continue;
      }

      if (current === '?') {
        regexPattern += '[^/]';
        continue;
      }

      regexPattern += current.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
    }

    regexPattern += '$';
    return new RegExp(regexPattern);
  }
}
