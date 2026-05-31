'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLinkBuilder } from '@/components/providers/LinkBuilderContext';

interface Theme {
  text: string;
  value: number;
}

export default function TopThemesCard({ data }: { data: Theme[] }) {
  const { urlBuilder } = useLinkBuilder();
  const themes = Array.isArray(data) ? data : [];

  const buildThemeSearchUrl = (theme: string): string => {
    const prsUrl = urlBuilder.getPRsUrl();
    const [basePath] = prsUrl.split('?');
    return `${basePath}?q=${encodeURIComponent(theme)}`;
  };

  const maxValue = themes.length > 0 ? Math.max(...themes.map((t) => t.value)) : 1;

  const getFontSize = (value: number): number => {
    // scale between 12px and 36px
    const min = 12;
    const max = 36;
    return Math.round(min + ((value / maxValue) * (max - min)));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Themes in Comments</CardTitle>
        <p className="text-xs text-gray-500 mt-1">Click a theme to view related PRs</p>
      </CardHeader>
      <CardContent>
        {themes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No themes available.</p>
        ) : (
          <div className="flex flex-wrap gap-3 items-center">
            {themes.map(({ text, value }) => (
              <a
                key={text}
                href={buildThemeSearchUrl(text)}
                target="_blank"
                rel="noopener noreferrer"
                title={`${value} occurrence${value !== 1 ? 's' : ''}`}
                style={{ fontSize: `${getFontSize(value)}px` }}
                className="text-blue-600 hover:text-blue-800 hover:underline leading-tight"
              >
                {text}
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
