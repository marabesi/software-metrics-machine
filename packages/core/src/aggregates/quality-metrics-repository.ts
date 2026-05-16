import { logger } from '@smmachine/utils';
import { type ISonarqubeMeasuresClient } from '../providers/sonarqube';
import { FileSystemRepository } from '../infrastructure/repository';

export interface IQualityMetricsRepository {
  getQualityMetrics(options?: any): Promise<any>;
  getMeasures(metrics?: string[]): Promise<any>;
}

/**
 * SonarQube quality metrics repository
 * Handles:
 * - Fetching code quality metrics from SonarQube
 * - Caching locally
 * - Providing filtered metric access
 */
export class QualityMetricsRepository implements IQualityMetricsRepository {
  private lastFetch?: any;
  private lastFetchTime: number = 0;
  private cacheDuration: number = 1000 * 60 * 60; // 1 hour
  private cache: FileSystemRepository<any>;

  constructor(private sonarqubeClient: ISonarqubeMeasuresClient, cacheDir: string = './outputs/sonarqube') {
    this.cache = new FileSystemRepository<any>(`${cacheDir}/measures.json`);
  }

  /**
   * Get quality metrics
   */
  async getQualityMetrics(options?: any): Promise<any> {
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

  /**
   * Get specific measures
   */
  async getMeasures(metrics?: string[]): Promise<any> {
    return this.getQualityMetrics({ metrics });
  }
}
