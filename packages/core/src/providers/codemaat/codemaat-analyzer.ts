import { Configuration } from '../../infrastructure';
import { CodeMaatMetricsRepository } from '../../aggregates/codemaat-metrics-repository';

/**
 * Thin wrapper around CodeMaatMetricsRepository that accepts a plain
 * data-directory path instead of a full Configuration object.
 */
export class CodemaatAnalyzer extends CodeMaatMetricsRepository {
  constructor(dataDir: string) {
    super({ getCodeMaatPath: () => dataDir } as unknown as Configuration);
  }
}
