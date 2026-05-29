'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLinkBuilder } from '@/components/providers/LinkBuilderContext';

export default function TopThemesCard({ data }: { data: string[] }) {
  const { urlBuilder } = useLinkBuilder();
  const themes = Array.isArray(data) ? data : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Themes</CardTitle>
        <p className="text-xs text-gray-500 mt-1">Click themes to view related PRs</p>
      </CardHeader>
      <CardContent>
        {themes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No themes available.</p>
        ) : (
          <ul className="space-y-2">
            {themes.map((theme) => (
              <li key={theme} className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50">
                <a
                  href={urlBuilder.getPRsUrl({ label: theme })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {theme}
                </a>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
