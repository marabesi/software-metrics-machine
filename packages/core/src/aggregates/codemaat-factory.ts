import { Configuration } from 'src/infrastructure';
import { CodeMaatMetricsRepository } from './codemaat-metrics-repository';
import { Logger } from '@smmachine/utils';

export class CodemaatFactory {
  static create(configuration: Configuration, logger: Logger): CodeMaatMetricsRepository {
    return new CodeMaatMetricsRepository(configuration, logger);
  }
}
