import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function resolveApiBaseUrl(): string {
  const apiBaseUrl = process.env.SMM_REST_BASE_URL;
  if (!apiBaseUrl) {
    throw new Error('Missing runtime API base URL. Set API_URL or SMM_REST_BASE_URL.');
  }

  return apiBaseUrl;
}

export async function GET() {
  try {
    const apiBaseUrl = resolveApiBaseUrl();

    return NextResponse.json(
      {
        apiBaseUrl,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Runtime API config error';

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
  }
}
