import { describe, expect, it } from 'vitest';
import { SonarqubeRepository } from '../../src/aggregates/sonarqube-repository';
import { InMemoryRepository } from '../../src/test/in-memory-repository';
import type {
  CodeMetric,
  SonarqubeComponentMeasure,
  SonarqubeComponentTreeMeasure,
  TimestampedStore,
} from '../../src/providers/sonarqube/types';

describe('SonarqubeRepository', () => {
  it('loads coverage history from timestamped historical measures', async () => {
    const historicalRepository = new InMemoryRepository<TimestampedStore<CodeMetric[]>>();
    await historicalRepository.save({
      entries: [
        {
          fetchedAt: '2024-03-01T00:00:00.000Z',
          data: [
            {
              key: 'coverage_2024-01-01T00:00:00+0000',
              name: 'coverage on 2024-01-01T00:00:00+0000',
              metric: 'coverage',
              value: '81.3',
              formatter: 'PERCENT',
              timestamp: '2024-01-01T00:00:00+0000',
            },
            {
              key: 'sqale_rating_2024-01-01T00:00:00+0000',
              name: 'sqale_rating on 2024-01-01T00:00:00+0000',
              metric: 'sqale_rating',
              value: '1.0',
              formatter: 'NUMBER',
              timestamp: '2024-01-01T00:00:00+0000',
            },
          ],
        },
      ],
    });

    const repository = new SonarqubeRepository(
      new InMemoryRepository<TimestampedStore<SonarqubeComponentMeasure>>(),
      new InMemoryRepository<TimestampedStore<SonarqubeComponentTreeMeasure[]>>(),
      historicalRepository
    );

    expect(await repository.loadCoverageHistory()).toEqual([
      {
        key: 'coverage_2024-01-01T00:00:00+0000',
        name: 'coverage on 2024-01-01T00:00:00+0000',
        metric: 'coverage',
        value: '81.3',
        formatter: 'PERCENT',
        timestamp: '2024-01-01T00:00:00+0000',
      },
    ]);
  });
});
