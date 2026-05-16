export interface ApiParams {
  start_date?: string;
  end_date?: string;
  [key: string]: string | number | undefined;
}

type RuntimeConfigResponse = {
  apiBaseUrl?: string;
};

function resolveServerApiBaseUrl(): string {
  const apiBaseUrl = process.env.SMM_REST_BASE_URL;

  if (!apiBaseUrl) {
    throw new Error('Missing runtime API base URL. Set SMM_REST_BASE_URL.');
  }

  return apiBaseUrl;
}

async function browserApiBaseUrl(): Promise<string> {
  return new Promise((resolve, reject) => {
    fetch('/api/runtime-config', {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Runtime config error: ${response.statusText}`);
        }

        const data = (await response.json()) as RuntimeConfigResponse;
        if (typeof data.apiBaseUrl === 'string' && data.apiBaseUrl.length > 0) {
          resolve(data.apiBaseUrl);
          return;
        }

        throw new Error('Runtime config missing apiBaseUrl');
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export async function fetchAPI<T>(endpoint: string, params?: ApiParams): Promise<T> {
  const apiBaseUrl = resolveServerApiBaseUrl();
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
