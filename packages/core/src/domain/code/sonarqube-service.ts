import { Logger, logger } from '@smmachine/utils';
import { SonarqubeRepository } from 'src/aggregates';

export class SonarQubeService {
  private logger: Logger = logger;

  constructor(private sonarqubeRepository: SonarqubeRepository) {}

  async getQualityMetrics(filters?: any): Promise<any> {
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
