export interface CodeMetric {
  key: string;
  name: string;
  value: string | number;
  formatter: string;
}

export interface SonarqubeComponentMeasure {
  key: string;
  name: string;
  type?: string; // Legacy or some API versions
  qualifier?: string; // SonarQube API returns this (FIL, DIR, TRK, etc.)
  measures: CodeMetric[];
}
