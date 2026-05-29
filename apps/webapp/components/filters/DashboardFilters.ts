export interface DashboardFilters {
  // Date filters
  startDate: string;
  endDate: string;

  // Pipeline filters
  workflowSelector?: string;
  workflowStatus: string[];
  workflowConclusions: string[];
  jobSelector: string[];
  branch: string[];
  event: string[];

  // PR filters
  authorSelect: string[];
  labelSelector: string[];
  pullRequestStatus?: 'open' | 'closed' | 'merged' | 'draft';
  aggregateBy?: string;

  // Source code filters
  ignorePatternFiles: string;
  includePatternFiles: string;
  authorSelectSourceCode: string[];
  topEntries: number;
  typeChurn?: string;

  // Metrics filters
  aggregateMetric: string;

  // SonarQube filters
  sonarqubeComponent: string;
  sonarqubeDepth: number;
  sonarqubeIgnorePatternFiles: string;
  sonarqubeIncludePatternFiles: string;
  sonarqubeRemoveFolders: boolean;
  sonarqubeMetrics: string[];
}

export const defaultFilters: DashboardFilters = {
  startDate: '',
  endDate: '',
  workflowSelector: undefined,
  workflowStatus: [],
  workflowConclusions: [],
  jobSelector: [],
  branch: [],
  event: [],
  authorSelect: [],
  labelSelector: [],
  aggregateBy: 'week',
  ignorePatternFiles: '',
  includePatternFiles: '',
  authorSelectSourceCode: [],
  topEntries: 20,
  typeChurn: 'added',
  aggregateMetric: 'avg',
  sonarqubeComponent: '',
  sonarqubeDepth: -1,
  sonarqubeIgnorePatternFiles: '',
  sonarqubeIncludePatternFiles: '',
  sonarqubeRemoveFolders: false,
  sonarqubeMetrics: ['complexity', 'cognitive_complexity', 'ncloc', 'coverage', 'sqale_rating'],
};

type SearchParamValue = string | string[] | undefined;

type SearchParamSource = Record<string, SearchParamValue>;

function getSingleValue(value: SearchParamValue): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function getArrayValue(value: SearchParamValue): string[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string' && value.length > 0) {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

function toNumber(value: string | undefined, fallback: number | undefined): number | undefined {
  if (!value) {
    return fallback;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

export function parseDashboardFilters(
  searchParams: SearchParamSource,
  fallback: DashboardFilters = defaultFilters,
): DashboardFilters {
  return {
    ...fallback,
    startDate: getSingleValue(searchParams.startDate) || fallback.startDate,
    endDate: getSingleValue(searchParams.endDate) || fallback.endDate,
    workflowSelector: getSingleValue(searchParams.workflowSelector) || undefined,
    workflowStatus: getArrayValue(searchParams.workflowStatus),
    workflowConclusions: getArrayValue(searchParams.workflowConclusions),
    jobSelector: getArrayValue(searchParams.jobSelector),
    branch: getArrayValue(searchParams.branch),
    event: getArrayValue(searchParams.event),
    aggregateMetric: getSingleValue(searchParams.aggregateMetric) || fallback.aggregateMetric,
    ignorePatternFiles: getSingleValue(searchParams.ignorePatternFiles) || fallback.ignorePatternFiles,
    includePatternFiles: getSingleValue(searchParams.includePatternFiles) || fallback.includePatternFiles,
    authorSelectSourceCode: getArrayValue(searchParams.authorSelectSourceCode),
    topEntries: toNumber(getSingleValue(searchParams.topEntries), fallback.topEntries) || fallback.topEntries,
    typeChurn: getSingleValue(searchParams.typeChurn) || fallback.typeChurn,
    authorSelect: getArrayValue(searchParams.authorSelect),
    labelSelector: getArrayValue(searchParams.labelSelector),
    pullRequestStatus: getSingleValue(searchParams.pullRequestStatus) as DashboardFilters['pullRequestStatus'] || fallback.pullRequestStatus,
    aggregateBy: getSingleValue(searchParams.aggregateBy) || fallback.aggregateBy,
    sonarqubeComponent: getSingleValue(searchParams.sonarqubeComponent) || fallback.sonarqubeComponent,
    sonarqubeDepth: toNumber(getSingleValue(searchParams.sonarqubeDepth), fallback.sonarqubeDepth) || fallback.sonarqubeDepth,
    sonarqubeIgnorePatternFiles:
      getSingleValue(searchParams.sonarqubeIgnorePatternFiles) || fallback.sonarqubeIgnorePatternFiles,
    sonarqubeIncludePatternFiles:
      getSingleValue(searchParams.sonarqubeIncludePatternFiles) || fallback.sonarqubeIncludePatternFiles,
    sonarqubeRemoveFolders: searchParams.sonarqubeRemoveFolders === 'true' || fallback.sonarqubeRemoveFolders,
    sonarqubeMetrics: getArrayValue(searchParams.sonarqubeMetrics).length
      ? getArrayValue(searchParams.sonarqubeMetrics)
      : fallback.sonarqubeMetrics,
  };
}

export function serializeDashboardFilters(filters: DashboardFilters): URLSearchParams {
  const params = new URLSearchParams();

  const append = (key: string, value: string | number | undefined) => {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  };

  const appendList = (key: string, values: string[] | undefined) => {
    if (values && values.length > 0) {
      params.set(key, values.join(','));
    }
  };

  append('startDate', filters.startDate);
  append('endDate', filters.endDate);
  append('workflowSelector', filters.workflowSelector);
  appendList('workflowStatus', filters.workflowStatus);
  appendList('workflowConclusions', filters.workflowConclusions);
  appendList('jobSelector', filters.jobSelector);
  appendList('branch', filters.branch);
  appendList('event', filters.event);
  append('aggregateMetric', filters.aggregateMetric);
  append('ignorePatternFiles', filters.ignorePatternFiles);
  append('includePatternFiles', filters.includePatternFiles);
  appendList('authorSelectSourceCode', filters.authorSelectSourceCode);
  append('topEntries', filters.topEntries);
  append('typeChurn', filters.typeChurn);
  appendList('authorSelect', filters.authorSelect);
  appendList('labelSelector', filters.labelSelector);
  append('pullRequestStatus', filters.pullRequestStatus);
  append('aggregateBy', filters.aggregateBy);
  append('sonarqubeComponent', filters.sonarqubeComponent);
  append('sonarqubeDepth', filters.sonarqubeDepth);
  append('sonarqubeIgnorePatternFiles', filters.sonarqubeIgnorePatternFiles);
  append('sonarqubeIncludePatternFiles', filters.sonarqubeIncludePatternFiles);
  append('sonarqubeRemoveFolders', filters.sonarqubeRemoveFolders ? 'true' : 'false');
  appendList('sonarqubeMetrics', filters.sonarqubeMetrics);

  return params;
}
