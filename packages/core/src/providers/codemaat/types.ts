export interface CodeChurn {
  date: string;
  added: number;
  deleted: number;
  commits: number;
}

export interface CodeChurnResult {
  data: CodeChurn[];
  startDate?: string;
  endDate?: string;
}

export interface FileCoupling {
  entity: string;
  coupled: string;
  degree: number;
  averageRevs: number;
}

export interface CodemaatAnalysisResult {
  churn?: CodeChurnResult;
  coupling?: FileCoupling[];
  entityChurn?: Array<Record<string, unknown>>;
  entityEffort?: Array<{ entity: string; 'total-revs': number }>;
  entityOwnership?: Array<{ entity: string; author: string; added: number; deleted: number }>;
}
