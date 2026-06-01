export interface CodeMetric {
  key: string;
  name: string;
  value: string | number;
  formatter: string;
}

export interface SonarqubeComponentTreeMeasure {
  key: string;
  name: string;
  type?: string; // Legacy or some API versions
  qualifier?: string; // SonarQube API returns this (FIL, DIR, TRK, etc.)
  measures: CodeMetric[];
}

export interface SonarqubeComponent {
  metric: string;
  value: string;
  bestValue: boolean;
}

export interface SonarqubeComponentMeasure {
  id: string;
  key: string;
  name: string;
  qualifier?: string;
  measures: SonarqubeComponent[];
}
