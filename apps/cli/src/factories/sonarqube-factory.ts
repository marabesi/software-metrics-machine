import { SonarqubeMetricsRepository } from '@smmachine/core/aggregates/sonarqube-metrics-repository';
import { Configuration } from '@smmachine/core/infrastructure/configuration';
import { SonarqubeMeasuresClient } from '@smmachine/core/providers/sonarqube/sonarqube-client';

export function createSonarqubeDependencies(
  config: Configuration,
): {
  qualityRepository: SonarqubeMetricsRepository;
} {
  const sonarqubeClient = new SonarqubeMeasuresClient(
    config.sonarUrl || '',
    config.sonarToken || '',
    config.sonarProject || ''
  );

  return {
    qualityRepository: new SonarqubeMetricsRepository(sonarqubeClient, config.getSonarqubePath()),
  };
}