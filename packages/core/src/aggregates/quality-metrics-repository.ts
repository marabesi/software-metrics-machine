import { logger } from '@utils/logger';
import { SonarqubeMeasuresClient } from '../../src/providers/sonarqube';

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

  constructor(private sonarqubeClient: SonarqubeMeasuresClient) {}

  /**
   * Get quality metrics
   */
  async getQualityMetrics(options?: any): Promise<any> {
    const now = Date.now();

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

    return metrics;
  }

  /**
   * Get specific measures
   */
  async getMeasures(metrics?: string[]): Promise<any> {
    return this.getQualityMetrics({ metrics });
  }
}
