'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TopThemesCard({ data }: { data: string[] }) {
  const themes = Array.isArray(data) ? data : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Themes</CardTitle>
      </CardHeader>
      <CardContent>
        {themes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No themes available.</p>
        ) : (
          <ul className="space-y-2">
            {themes.map((theme) => (
              <li key={theme} className="rounded-md border px-3 py-2 text-sm">
                {theme}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
