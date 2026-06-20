import { Logger } from '@smmachine/utils';
import { SonarqubeRepository } from 'src/aggregates';

export interface QualityFilters {
  metrics?: string[];
  startDate?: string;
  endDate?: string;
  component?: string;
  depth?: number;
  forceRefresh?: boolean;
  incrementalUpdate?: boolean;
}

export class SonarQubeService {
  constructor(
    private sonarqubeRepository: SonarqubeRepository,
    private logger: Logger
  ) {}

  async getQualityMetrics(_filters?: unknown): Promise<unknown> {
    this.logger.info('Fetching SonarQube quality metrics...');
    try {
      const metrics = await this.sonarqubeRepository.loadAll();
      // Apply any necessary filtering logic here based on the provided filters
      return metrics;
    } catch (error) {
      this.logger.error('Error fetching SonarQube metrics:', error);
      throw error;
    }
  }
}
