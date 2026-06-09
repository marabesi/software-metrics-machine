import { ApiParams, fetchAPI } from './client';

export type SonarqubeComponentMeasure = {
  key: string;
  name: string;
  type?: string;
  qualifier?: string;
  measures?: Array<{ key?: string; metric?: string; name?: string; value?: string | number }>;
};

export type SonarqubeMeasurement = { metric: string; value: string };

export type SonarqubeMeasurementHistoryEntry = {
  fetchedAt: string;
  data: SonarqubeMeasurement[];
};

export type SonarqubeComponentTreeHistoryEntry = {
  fetchedAt: string;
  data: SonarqubeComponentMeasure[];
};

export const sonarqubeAPI = {
  componentTree: (params?: ApiParams) =>
    fetchAPI<SonarqubeComponentMeasure[]>(
      '/sonarqube/component-tree',
      params
    ),

  quality: (params?: ApiParams) =>
    fetchAPI<unknown>('/sonarqube/quality', params),

  loadMeasurements: (params?: ApiParams) =>
    fetchAPI<SonarqubeMeasurement[]>('/sonarqube/measurements', params),

  loadMeasurementHistory: (params?: ApiParams) =>
    fetchAPI<SonarqubeMeasurementHistoryEntry[]>('/sonarqube/measurements/history', params),

  loadComponentTreeHistory: (params?: ApiParams) =>
    fetchAPI<SonarqubeComponentTreeHistoryEntry[]>('/sonarqube/component-tree/history', params),
};
