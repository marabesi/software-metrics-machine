import { ApiParams, fetchAPI } from './client';

export const sourceCodeAPI = {
  pairingIndex: (params?: ApiParams) =>
    fetchAPI<{ pairing_index_percentage: number; total_analyzed_commits: number; paired_commits: number }>(
      '/code/pairing-index',
      params
    ),
  
  entityChurn: (params?: ApiParams) =>
    fetchAPI<Array<{ entity: string; added: number; deleted: number; commits: number }>>(
      '/code/entity-churn',
      params
    ),
  
  codeChurn: (params?: ApiParams) =>
    fetchAPI<Array<{ date: string; type: string; value: number }>>(
      '/code/code-churn',
      params
    ),
  
  coupling: (params?: ApiParams) =>
    fetchAPI<Array<{ entity: string; coupled: string; degree: number; averageRevs: number }>>(
      '/code/coupling',
      params
    ),
  
  entityEffort: (params?: ApiParams) =>
    fetchAPI<Array<{ entity: string; 'total-revs': number }>>(
      '/code/entity-effort',
      params
    ),
  
  entityOwnership: (params?: ApiParams) =>
    fetchAPI<Array<{ entity: string; author: string; added: number; deleted: number }>>(
      '/code/entity-ownership',
      params
    ),
  
  getAuthors: () =>
    fetchAPI<string[]>('/code/authors'),
};
