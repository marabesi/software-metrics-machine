import 'server-only';

type ServerEnv = {
  smmRestBaseUrl: string;
};

let cachedEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const smmRestBaseUrl = process.env.SMM_REST_BASE_URL;

  if (!smmRestBaseUrl) {
    throw new Error('Missing runtime API base URL. Set SMM_REST_BASE_URL.');
  }

  cachedEnv = {
    smmRestBaseUrl,
  };

  return cachedEnv;
}
