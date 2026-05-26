import { ApiParams, fetchAPI } from './client';

export const sonarqubeAPI = {
  componentTree: (params?: ApiParams) =>
    fetchAPI<Array<{ key: string; name: string; measures?: Array<{ key?: string; metric?: string; name?: string; value?: string | number }> }>>(
      '/sonarqube/component-tree',
      params
    ),

  quality: (params?: ApiParams) =>
    fetchAPI<any>('/sonarqube/quality', params),
};
