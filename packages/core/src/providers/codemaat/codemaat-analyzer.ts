import { Configuration } from '../../infrastructure';
import { CodeMaatMetricsRepository } from '../../aggregates/codemaat-metrics-repository';
import type { Logger } from '@smmachine/utils';

/**
 * Thin wrapper around CodeMaatMetricsRepository that accepts a plain
 * data-directory path instead of a full Configuration object.
 */
export class CodemaatAnalyzer extends CodeMaatMetricsRepository {
  constructor(dataDir: string, logger: Logger) {
    super({ getCodeMaatPath: () => dataDir } as unknown as Configuration, logger);
  }
}
