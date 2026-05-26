import { Configuration } from 'src/infrastructure';
import { CodeMaatMetricsRepository } from './codemaat-metrics-repository';

export class CodemaatFactory {
  static create(configuration: Configuration): CodeMaatMetricsRepository {
    return new CodeMaatMetricsRepository(configuration);
  }
}
