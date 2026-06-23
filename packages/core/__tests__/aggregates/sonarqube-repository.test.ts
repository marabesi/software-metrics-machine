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
  it('filters component tree entries with shared include and ignore patterns', async () => {
    const componentTreeRepository = new InMemoryRepository<
      TimestampedStore<SonarqubeComponentTreeMeasure[]>
    >();
    await componentTreeRepository.save({
      entries: [
        {
          fetchedAt: '2024-03-01T00:00:00.000Z',
          data: [
            {
              key: 'src/Button.ts',
              name: 'Button.ts',
              qualifier: 'FIL',
            },
            {
              key: 'src/Button.test.ts',
              name: 'Button.test.ts',
              qualifier: 'FIL',
            },
            {
              key: 'docs/readme.md',
              name: 'readme.md',
              qualifier: 'FIL',
            },
          ],
        },
      ],
    });

    const repository = new SonarqubeRepository(
      new InMemoryRepository<TimestampedStore<SonarqubeComponentMeasure>>(),
      componentTreeRepository
    );

    await expect(
      repository.loadComponentTree({
        include_files: 'src/**',
        ignore_files: '*.test.ts',
      })
    ).resolves.toEqual([
      {
        key: 'src/Button.ts',
        name: 'Button.ts',
        qualifier: 'FIL',
      },
    ]);
  });

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
