/**
 * PR-related domain types for analytics
 */

export interface PRLabel {
  name: string;
  description?: string;
}

export interface PRUser {
  login: string;
  id: number;
}

export interface PRDetails {
  id: number;
  number: number;
  title: string;
  createdAt: string; // ISO format
  updatedAt: string;
  mergedAt?: string; // null if not merged
  closedAt?: string;
  author: PRUser;
  labels: PRLabel[];
  state: 'open' | 'closed' | 'merged';
  url: string;
  comments: number;
}

export interface PRFilters {
  startDate?: string;
  endDate?: string;
  authors?: string[];
  labels?: string[];
  state?: 'merged' | 'closed' | 'open';
  rawFilters?: string; // key=value,key2=value2
}

export interface PRMetrics {
  averageOpenDays: number;
  totalPRs: number;
  mergedPRs: number;
  closedPRs: number;
  openPRs: number;
  averageComments: number;
}

export interface PRsByTimeframe {
  period: string;
  count: number;
  averageOpenDays: number;
  averageComments: number;
}

export interface LabelSummary {
  label: string;
  count: number;
  averageOpenDays: number;
}
