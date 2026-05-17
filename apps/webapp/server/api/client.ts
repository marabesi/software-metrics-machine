'use server';

import { getServerEnv } from '../config/server-env';

export interface ApiParams {
  start_date?: string;
  end_date?: string;
  [key: string]: string | number | undefined;
}

export async function fetchAPI<T>(endpoint: string, params?: ApiParams): Promise<T> {
  const { smmRestBaseUrl } = getServerEnv();
  const apiBaseUrl = `${smmRestBaseUrl}/api/v1`;
  const url = new URL(endpoint, apiBaseUrl);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}
