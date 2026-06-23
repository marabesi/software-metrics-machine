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

  describe('loadAll', () => {
    it('returns null when there is no data in the measurement repository', async () => {
      const repository = new SonarqubeRepository(
        new InMemoryRepository<TimestampedStore<SonarqubeComponentMeasure>>(),
        new InMemoryRepository<TimestampedStore<SonarqubeComponentTreeMeasure[]>>()
      );

      expect(await repository.loadAll()).toBeNull();
    });

    it('returns the latest measure as-is when no filter is supplied', async () => {
      const measurementRepository = new InMemoryRepository<
        TimestampedStore<SonarqubeComponentMeasure>
      >();
      const measure: SonarqubeComponentMeasure = {
        id: '1',
        key: 'project-a',
        name: 'Project A',
        measures: [
          { metric: 'coverage', value: '81.3', bestValue: false },
          { metric: 'bugs', value: '2', bestValue: true },
        ],
      };
      await measurementRepository.save({
        entries: [{ fetchedAt: '2024-03-01T00:00:00.000Z', data: measure }],
      });

      const repository = new SonarqubeRepository(
        measurementRepository,
        new InMemoryRepository<TimestampedStore<SonarqubeComponentTreeMeasure[]>>()
      );

      expect(await repository.loadAll()).toEqual(measure);
    });

    it('filters measures using an object-form measures filter', async () => {
      const measurementRepository = new InMemoryRepository<
        TimestampedStore<SonarqubeComponentMeasure>
      >();
      const measure: SonarqubeComponentMeasure = {
        id: '1',
        key: 'project-a',
        name: 'Project A',
        measures: [
          { metric: 'coverage', value: '81.3', bestValue: false },
          { metric: 'bugs', value: '2', bestValue: true },
        ],
      };
      await measurementRepository.save({
        entries: [{ fetchedAt: '2024-03-01T00:00:00.000Z', data: measure }],
      });

      const repository = new SonarqubeRepository(
        measurementRepository,
        new InMemoryRepository<TimestampedStore<SonarqubeComponentTreeMeasure[]>>()
      );

      expect(await repository.loadAll({ measures: ['coverage'] })).toEqual({
        ...measure,
        measures: [{ metric: 'coverage', value: '81.3', bestValue: false }],
      });
    });

    it('filters measures using a bare string array filter', async () => {
      const measurementRepository = new InMemoryRepository<
        TimestampedStore<SonarqubeComponentMeasure>
      >();
      const measure: SonarqubeComponentMeasure = {
        id: '1',
        key: 'project-a',
        name: 'Project A',
        measures: [
          { metric: 'coverage', value: '81.3', bestValue: false },
          { metric: 'bugs', value: '2', bestValue: true },
        ],
      };
      await measurementRepository.save({
        entries: [{ fetchedAt: '2024-03-01T00:00:00.000Z', data: measure }],
      });

      const repository = new SonarqubeRepository(
        measurementRepository,
        new InMemoryRepository<TimestampedStore<SonarqubeComponentTreeMeasure[]>>()
      );

      expect(await repository.loadAll(['bugs'])).toEqual({
        ...measure,
        measures: [{ metric: 'bugs', value: '2', bestValue: true }],
      });
    });

    it('falls back to an empty measures array when the stored measure has none', async () => {
      const measurementRepository = new InMemoryRepository<
        TimestampedStore<SonarqubeComponentMeasure>
      >();
      const measure = {
        id: '1',
        key: 'project-a',
        name: 'Project A',
      } as unknown as SonarqubeComponentMeasure;
      await measurementRepository.save({
        entries: [{ fetchedAt: '2024-03-01T00:00:00.000Z', data: measure }],
      });

      const repository = new SonarqubeRepository(
        measurementRepository,
        new InMemoryRepository<TimestampedStore<SonarqubeComponentTreeMeasure[]>>()
      );

      expect(await repository.loadAll({ measures: ['coverage'] })).toEqual({
        ...measure,
        measures: [],
      });
    });
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
