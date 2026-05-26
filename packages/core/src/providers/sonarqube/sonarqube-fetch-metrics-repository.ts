import { logger } from '@smmachine/utils';
import { SonarqubeComponentMeasure, type ISonarqubeMeasuresClient } from '..';
import { Configuration, FileSystemRepository } from '../../infrastructure';

export interface IQualityMetricsRepository {
  fetchQualityMetrics(options?: any): Promise<any>;
  fetchComponentTree(options?: any): Promise<any>;
}

export class SonarqubeFetchMetricsRepository implements IQualityMetricsRepository {
  private lastFetch?: any;
  private lastFetchTime: number = 0;
  private cacheDuration: number = 1000 * 60 * 60; // 1 hour
  private cache: FileSystemRepository<any>;
  private cacheComponentTree: FileSystemRepository<SonarqubeComponentMeasure[]>;

  constructor(
    private sonarqubeClient: ISonarqubeMeasuresClient,
    private configuration: Configuration
  ) {
    const cacheDir = this.configuration.getSonarqubePath();
    this.cache = new FileSystemRepository<any>(`${cacheDir}/measures.json`);
    this.cacheComponentTree = new FileSystemRepository<SonarqubeComponentMeasure[]>(
      `${cacheDir}/component-tree.json`
    );
  }

  /**
   * Get quality metrics
   */
  async fetchQualityMetrics(options?: any): Promise<any> {
    const now = Date.now();

    // If memory cache is cold, try to load last saved metrics from disk.
    if (!this.lastFetch) {
      const fromDisk = await this.cache.load();
      if (fromDisk) {
        this.lastFetch = fromDisk;
        this.lastFetchTime = now;
      }
    }

    // Use cache if recent
    if (this.lastFetch && now - this.lastFetchTime < this.cacheDuration) {
      logger.info('Using cached quality metrics');
      return this.lastFetch;
    }

    logger.info('Fetching quality metrics from SonarQube...');
    const metrics = await this.sonarqubeClient.fetchComponentMeasures({
      metrics: options?.metrics || [
        'coverage',
        'sqale_rating',
        'complexity',
        'duplicated_lines_density',
      ],
    });

    this.lastFetch = metrics;
    this.lastFetchTime = now;
    await this.cache.save(metrics);

    return metrics;
  }

  async fetchComponentTree(options?: any): Promise<SonarqubeComponentMeasure[]> {
    try {
      logger.debug(`Fetching component tree: ${JSON.stringify(options)}`);

      const cached = await this.cacheComponentTree.load();
      if (cached) {
        logger.info('Using cached component tree');
        return cached;
      }

      const componentTree = await this.sonarqubeClient.fetchComponentTree({
        component: options?.component,
        depth: options?.depth,
        metrics: options?.metrics,
      });
      await this.cacheComponentTree.save(componentTree);

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
}
