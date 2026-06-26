import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CodeMaatMetricsRepository } from '../../src/aggregates/codemaat-metrics-repository';
import { Configuration } from '../../src/infrastructure/configuration';
import { MockLoggerBuilder } from '../mock-logger-builder';

describe('CodeMaatMetricsRepository', () => {
  let dataDir: string;
  let repository: CodeMaatMetricsRepository;

  beforeEach(() => {
    dataDir = mkdtempSync(path.join(tmpdir(), 'smm-codemaat-regression-'));
    repository = new CodeMaatMetricsRepository(
      { getCodeMaatPath: () => dataDir } as unknown as Configuration,
      new MockLoggerBuilder().build()
    );
  });

  afterEach(() => {
    rmSync(dataDir, { recursive: true, force: true });
  });

  it('applies shared include and ignore patterns to file coupling', async () => {
    writeFileSync(
      path.join(dataDir, 'coupling.csv'),
      [
        'entity,coupled,degree,average-revs',
        'src/Button.ts,src/utils.ts,90,4',
        'src/Button.test.ts,src/utils.ts,80,3',
        'docs/readme.md,docs/assets.md,70,2',
      ].join('\n')
    );

    await expect(
      repository.getFileCoupling({
        includePatterns: 'src/**',
        ignorePatterns: '*.test.ts',
        sortBy: 'degree',
      })
    ).resolves.toEqual([
      {
        entity: 'src/Button.ts',
        coupled: 'src/utils.ts',
        degree: 90,
        averageRevs: 4,
      },
    ]);
  });

  it('applies shared include and ignore patterns to entity metrics', async () => {
    writeFileSync(
      path.join(dataDir, 'entity-churn.csv'),
      [
        'entity,added,deleted,commits',
        'src/Button.ts,10,2,3',
        'src/Button.test.ts,100,20,5',
        'docs/readme.md,50,10,4',
      ].join('\n')
    );
    writeFileSync(
      path.join(dataDir, 'entity-effort.csv'),
      ['entity,total-revs', 'src/Button.ts,3', 'src/Button.test.ts,9', 'docs/readme.md,5'].join(
        '\n'
      )
    );
    writeFileSync(
      path.join(dataDir, 'entity-ownership.csv'),
      [
        'entity,author,added,deleted',
        'src/Button.ts,Ada,10,2',
        'src/Button.test.ts,Grace,100,20',
        'docs/readme.md,Linus,50,10',
      ].join('\n')
    );

    const filters = {
      includePatterns: 'src/**',
      ignorePatterns: '*.test.ts',
    };

    await expect(repository.getEntityChurn(filters)).resolves.toEqual([
      {
        entity: 'src/Button.ts',
        added: 10,
        deleted: 2,
        commits: 3,
      },
    ]);
    await expect(repository.getEntityEffort(filters)).resolves.toEqual([
      {
        entity: 'src/Button.ts',
        'total-revs': 3,
      },
    ]);
    await expect(repository.getEntityOwnership(filters)).resolves.toEqual([
      {
        entity: 'src/Button.ts',
        author: 'Ada',
        added: 10,
        deleted: 2,
      },
    ]);
  });

  it('filters daily code churn rows when date-time filters are provided', async () => {
    writeFileSync(
      path.join(dataDir, 'abs-churn.csv'),
      [
        'date,added,deleted,commits',
        '2026-01-04,10,1,1',
        '2026-01-05,20,2,2',
        '2026-01-06,30,3,3',
      ].join('\n')
    );

    await expect(
      repository.getCodeChurn({
        startDate: '2026-01-05T08:30:00+01:00',
        endDate: '2026-01-05T17:45:00+01:00',
      })
    ).resolves.toEqual({
      data: [
        {
          date: '2026-01-05',
          added: 20,
          deleted: 2,
          commits: 2,
        },
      ],
      startDate: '2026-01-05T08:30:00+01:00',
      endDate: '2026-01-05T17:45:00+01:00',
    });
  });
});
