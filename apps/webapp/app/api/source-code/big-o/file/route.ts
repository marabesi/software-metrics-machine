import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getServerEnv } from '@/server/config/server-env';
import type { BigOFileAnalysis } from '@/server/api/sourceCode';

export async function GET(request: NextRequest) {
  const filePath = request.nextUrl.searchParams.get('file_path');

  if (!filePath) {
    return NextResponse.json({ error: 'file_path is required' }, { status: 400 });
  }

  const { smmRestBaseUrl } = getServerEnv();
  const url = new URL('/code/big-o/file', smmRestBaseUrl);
  url.searchParams.set('file_path', filePath);

  const cookieStore = await cookies();
  const activeProject = cookieStore.get('smm_active_project')?.value;
  if (activeProject) {
    url.searchParams.set('project', decodeURIComponent(activeProject));
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;

    return NextResponse.json(
      { error: body?.message ?? `API error: ${response.statusText}` },
      { status: response.status }
    );
  }

  const analysis = (await response.json()) as BigOFileAnalysis;
  return NextResponse.json(analysis);
}
