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

export interface SonarqubeMeasure {
  metric: string;
  value: string;
}

export interface TimestampedEntry<T> {
  fetchedAt: string;
  data: T;
}

export interface TimestampedStore<T> {
  entries: TimestampedEntry<T>[];
}

export function extractLatestData<T>(raw: TimestampedStore<T> | null): T | null {
  if (!raw) return null;
  if (Array.isArray((raw as any).entries) && (raw as any).entries.length > 0) {
    const entries = (raw as any).entries as TimestampedEntry<T>[];
    return entries[entries.length - 1].data;
  }
  // Legacy format (not wrapped in TimestampedStore)
  if (!(raw as any).entries) {
    return raw as unknown as T;
  }
  return null;
}
