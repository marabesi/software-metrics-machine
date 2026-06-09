import { logger } from '@smmachine/utils';
import { SonarqubeComponentMeasure, type ISonarqubeMeasuresClient } from '..';
import { Configuration, FileSystemRepository } from '../../infrastructure';
import { TimestampedStore, extractLatestData } from './types';

export interface IQualityMetricsRepository {
  fetchQualityMetrics(options?: any): Promise<any>;
  fetchComponentTree(options?: any): Promise<any>;
  fetchHistoricalMeasures(options?: {
    metrics?: string[];
    startDate?: string;
    endDate?: string;
  }): Promise<any[]>;
}

export class SonarqubeFetchMetricsRepository implements IQualityMetricsRepository {
  private cache: FileSystemRepository<TimestampedStore<SonarqubeComponentMeasure>>;
  private cacheComponentTree: FileSystemRepository<TimestampedStore<SonarqubeComponentMeasure[]>>;
  private cacheHistorical: FileSystemRepository<TimestampedStore<any[]>>;

  constructor(
    private sonarqubeClient: ISonarqubeMeasuresClient,
    private configuration: Configuration
  ) {
    const cacheDir = this.configuration.getSonarqubePath();
    this.cache = new FileSystemRepository<TimestampedStore<SonarqubeComponentMeasure>>(`${cacheDir}/measures.json`);
    this.cacheComponentTree = new FileSystemRepository<TimestampedStore<SonarqubeComponentMeasure[]>>(
      `${cacheDir}/component-tree.json`
    );
    this.cacheHistorical = new FileSystemRepository<TimestampedStore<any[]>>(`${cacheDir}/historical-measures.json`);
  }

  /**
   * Get quality metrics
   */
  async fetchQualityMetrics(options?: any): Promise<any> {
    logger.info('Fetching quality metrics from SonarQube...');
    const metrics = await this.sonarqubeClient.fetchComponentMeasures({
      metrics: options?.metrics,
    });

    await this.appendTimestampedEntry(this.cache, metrics);

    return metrics;
  }

  async fetchComponentTree(options?: any): Promise<SonarqubeComponentMeasure[]> {
    try {
      logger.debug(`Fetching component tree: ${JSON.stringify(options)}`);

      const componentTree = await this.sonarqubeClient.fetchComponentTree({
        component: options?.component,
        depth: options?.depth,
        metrics: options?.metrics,
      });
      await this.appendTimestampedEntry(this.cacheComponentTree, componentTree);

      return componentTree;
    } catch (error) {
      logger.error(
        `Failed to fetch component tree: ${error}`,
        error instanceof Error ? error.stack : ''
      );
      throw new Error(
        `Failed to fetch component tree: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async fetchHistoricalMeasures(options?: {
    metrics?: string[];
    startDate?: string;
    endDate?: string;
    forceRefresh?: boolean;
    incrementalUpdate?: boolean;
  }): Promise<any[]> {
    try {
      logger.debug(`Fetching historical measures: ${JSON.stringify(options)}`);

      const fromDisk = await this.cacheHistorical.load();
      const cachedData = extractLatestData(fromDisk);
      const cached: any[] = Array.isArray(cachedData) ? cachedData : [];

      if (options?.incrementalUpdate) {
        if (cached.length > 0) {
          const latestDate = this.findLatestDateInMeasures(cached);
          logger.info(`Incremental update: fetching historical measures after ${latestDate}...`);
          const fresh = await this.sonarqubeClient.fetchHistoricalMeasures({
            metrics: options?.metrics,
            startDate: latestDate,
            endDate: options?.endDate,
          });
          const merged = this.mergeHistoricalMeasures(cached, fresh);
          await this.appendTimestampedEntry(this.cacheHistorical, merged);
          return merged;
        }
      }

      // Manual date range with merge
      if ((options?.startDate || options?.endDate) && !options?.forceRefresh) {
        if (cached.length > 0) {
          logger.info(
            `Fetching historical measures for range [${options?.startDate || 'any'}..${options?.endDate || 'any'}] and merging with cache...`
          );
          const fresh = await this.sonarqubeClient.fetchHistoricalMeasures({
            metrics: options?.metrics,
            startDate: options?.startDate,
            endDate: options?.endDate,
          });
          const merged = this.mergeHistoricalMeasures(cached, fresh);
          await this.appendTimestampedEntry(this.cacheHistorical, merged);
          return merged;
        }
      }

      const historical = await this.sonarqubeClient.fetchHistoricalMeasures(options);
      await this.appendTimestampedEntry(this.cacheHistorical, historical);
      return historical;
    } catch (error) {
      logger.error(
        `Failed to fetch historical measures: ${error}`,
        error instanceof Error ? error.stack : ''
      );
      throw new Error(
        `Failed to fetch historical measures: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private findLatestDateInMeasures(measures: any[]): string {
    const timestamps = measures
      .map((m) => m.timestamp as string | undefined)
      .filter((t): t is string => !!t)
      .map((t) => new Date(t).getTime());
    if (timestamps.length === 0) return new Date(0).toISOString();
    return new Date(Math.max(...timestamps)).toISOString();
  }

  private mergeHistoricalMeasures(existing: any[], incoming: any[]): any[] {
    const key = (m: any): string => `${m.metric ?? ''}_${m.timestamp ?? ''}`;
    const map = new Map<string, any>();
    for (const m of existing) map.set(key(m), m);
    for (const m of incoming) map.set(key(m), m);
    return Array.from(map.values());
  }

  private async appendTimestampedEntry<T>(
    repo: FileSystemRepository<TimestampedStore<T>>,
    data: T,
  ): Promise<void> {
    const raw = await repo.load();
    let store: TimestampedStore<T>;

    if (raw && Array.isArray((raw as any).entries)) {
      store = raw as TimestampedStore<T>;
    } else if (raw) {
      // Legacy format: migrate old data as first entry
      store = { entries: [{ fetchedAt: new Date(0).toISOString(), data: raw as unknown as T }] };
    } else {
      store = { entries: [] };
    }

    store.entries.push({ fetchedAt: new Date().toISOString(), data });
    await repo.save(store);
  }
}
