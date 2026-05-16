import { ApiParams, fetchAPI } from './client';

export const pullRequestAPI = {
  // Data endpoints
  summary: (params?: ApiParams) =>
    fetchAPI<{
      total: number;
      merged: number;
      closed: number;
      open: number;
      first_pr: string | null;
      last_pr: string | null;
    }>('/pull-requests/summary', params),
  
  byAuthor: (params?: ApiParams) =>
    fetchAPI<Array<{ author: string; count: number }>>(
      '/pull-requests/by-author',
      params
    ),
  
  averageReviewTime: (params?: ApiParams) =>
    fetchAPI<Array<{ author: string; avg_hours: number }>>(
      '/pull-requests/average-review-time',
      params
    ),
  
  openThroughTime: (params?: ApiParams) =>
    fetchAPI<Array<{ date: string; open_prs: number }>>(
      '/pull-requests/through-time',
      params
    ),
  
  averageOpenBy: (params?: ApiParams) =>
    fetchAPI<Array<{ period: string; avg_days: number }>>(
      '/pull-requests/average-open-by',
      params
    ),
  
  averageComments: (params?: ApiParams) =>
    fetchAPI<{ avg_comments: number }>('/pull-requests/average-comments', params),

  // Filter option endpoints
  getAuthors: () =>
    fetchAPI<string[]>('/pull-requests/authors'),

  getLabels: () =>
    fetchAPI<string[]>('/pull-requests/labels'),
};
