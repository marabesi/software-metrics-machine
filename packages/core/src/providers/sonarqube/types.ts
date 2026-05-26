export interface CodeMetric {
  key: string;
  name: string;
  value: string | number;
  formatter: string;
}

export interface SonarqubeComponentMeasure {
  key: string;
  name: string;
  measures: CodeMetric[];
}
