import { Configuration } from 'src/infrastructure';
import { CodeMaatMetricsRepository } from '../providers/codemaat/codemaat-metrics-repository';

export class CodemaatFactory {
  static create(configuration: Configuration): CodeMaatMetricsRepository {
    return new CodeMaatMetricsRepository(configuration);
  }
}
