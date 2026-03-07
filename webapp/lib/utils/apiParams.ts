import { ApiParams } from '@/lib/api';

export interface DashboardFilters {
  startDate: string;
  endDate: string;
  workflowSelector?: string;
  workflowStatus?: string[];
  workflowConclusions?: string[];
  jobSelector?: string[];
  branch?: string[];
  event?: string[];
  aggregateMetric?: string;
  ignorePatternFiles?: string;
  includePatternFiles?: string;
  authorSelectSourceCode?: string[];
  topEntries?: number;
  typeChurn?: string;
  authorSelect?: string[];
  labelSelector?: string[];
  aggregateBy?: string;
}

/**
 * Convert pipeline section filters to API parameters
 */
export function buildPipelineApiParams(filters: DashboardFilters): ApiParams {
  return {
    start_date: filters.startDate,
    end_date: filters.endDate,
    workflow_path: filters.workflowSelector !== 'All' ? filters.workflowSelector : undefined,
    status: filters.workflowStatus?.length ? filters.workflowStatus.join(',') : undefined,
    conclusion: filters.workflowConclusions?.length ? filters.workflowConclusions.join(',') : undefined,
    job_name: filters.jobSelector?.length ? filters.jobSelector.join(',') : undefined,
    branch: filters.branch?.length ? filters.branch.join(',') : undefined,
    event: filters.event?.length ? filters.event.join(',') : undefined,
    metric: filters.aggregateMetric,
  };
}

/**
 * Convert source code section filters to API parameters
 */
export function buildSourceCodeApiParams(filters: DashboardFilters): ApiParams {
  return {
    start_date: filters.startDate,
    end_date: filters.endDate,
    ignore_pattern: filters.ignorePatternFiles || undefined,
    include_pattern: filters.includePatternFiles || undefined,
    authors: filters.authorSelectSourceCode?.length
      ? filters.authorSelectSourceCode.join(',')
      : undefined,
    top: filters.topEntries,
    type_churn: filters.typeChurn,
  };
}

/**
 * Convert pull request section filters to API parameters
 */
export function buildPullRequestApiParams(filters: DashboardFilters): ApiParams {
  return {
    start_date: filters.startDate,
    end_date: filters.endDate,
    authors: filters.authorSelect?.length ? filters.authorSelect.join(',') : undefined,
    labels: filters.labelSelector?.length ? filters.labelSelector.join(',') : undefined,
    aggregate_by: filters.aggregateBy,
  };
}

/**
 * Batch export for easy access to all builders
 */
export const apiParamBuilders = {
  pipeline: buildPipelineApiParams,
  sourceCode: buildSourceCodeApiParams,
  pullRequest: buildPullRequestApiParams,
};
