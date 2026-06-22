import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { Configuration } from '../../../src/infrastructure';
import { CodemaatFetchRepository } from '../../../src/providers/codemaat/codemaat-fetch-repository';
import { MockLoggerBuilder } from '../../mock-logger-builder';

describe('CodemaatFetchRepository', () => {
  const logger = new MockLoggerBuilder().build();

  it('throws when startDate is missing', () => {
    const configuration = new Configuration({ gitRepositoryLocation: '/some/path' });
    const repository = new CodemaatFetchRepository(configuration, logger);

    expect(() => repository.fetch({ startDate: '' })).toThrow(
      'startDate is required for CodeMaat fetch.'
    );
  });

  it('throws when no repository path is configured', () => {
    const configuration = new Configuration({ gitRepositoryLocation: '' });
    const repository = new CodemaatFetchRepository(configuration, logger);

    expect(() => repository.fetch({ startDate: '2026-01-01' })).toThrow(
      'Git repository path is not configured.'
    );
  });
});
