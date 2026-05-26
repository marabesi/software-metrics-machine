'use client';

import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import { Tab, Tabs } from '@mui/material';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ensureArray } from '@/server/utils/chartData';
import { EntityOwnershipData } from './types';

export default function EntityOwnershipCard({ data }: { data: EntityOwnershipData[] }) {
  const [activeTab, setActiveTab] = useState<'by-author' | 'by-file'>('by-author');

  const byAuthor = useMemo(() => {
    type AuthorAggregate = {
      author: string;
      added: number;
      deleted: number;
      topEntity: string;
      topEntityChanges: number;
    };

    const accumulator = new Map<string, AuthorAggregate>();

    for (const row of ensureArray<EntityOwnershipData>(data)) {
      const author = (row.author || '').trim() || 'Unknown';
      const current =
        accumulator.get(author) ||
        ({
          author,
          added: 0,
          deleted: 0,
          topEntity: '-',
          topEntityChanges: 0,
        } satisfies AuthorAggregate);
      const entity = (row.entity || '').trim() || '-';
      const changes = Number(row.added || 0) + Number(row.deleted || 0);

      current.added += Number(row.added || 0);
      current.deleted += Number(row.deleted || 0);

      if (changes > current.topEntityChanges) {
        current.topEntity = entity;
        current.topEntityChanges = changes;
      }

      accumulator.set(author, current);
    }

    return Array.from(accumulator.values())
      .sort((a, b) => b.added + b.deleted - (a.added + a.deleted))
      .slice(0, 15);
  }, [data]);

  const topOwnerByFile = useMemo(() => {
    type AuthorStats = { author: string; added: number; deleted: number; changes: number };
    type FileStats = { entity: string; totalChanges: number; authors: Map<string, AuthorStats> };

    const files = new Map<string, FileStats>();

    for (const row of ensureArray<EntityOwnershipData>(data)) {
      const entity = (row.entity || '').trim();
      if (!entity) {
        continue;
      }

      const author = (row.author || '').trim() || 'Unknown';
      const added = Number(row.added || 0);
      const deleted = Number(row.deleted || 0);
      const changes = added + deleted;

      const fileStats =
        files.get(entity) ||
        ({
          entity,
          totalChanges: 0,
          authors: new Map<string, AuthorStats>(),
        } satisfies FileStats);

      const authorStats =
        fileStats.authors.get(author) ||
        ({
          author,
          added: 0,
          deleted: 0,
          changes: 0,
        } satisfies AuthorStats);

      authorStats.added += added;
      authorStats.deleted += deleted;
      authorStats.changes += changes;

      fileStats.totalChanges += changes;
      fileStats.authors.set(author, authorStats);
      files.set(entity, fileStats);
    }

    return Array.from(files.values())
      .map((file) => {
        const topAuthor = Array.from(file.authors.values()).sort((a, b) => b.changes - a.changes)[0];
        const ownershipPct = file.totalChanges > 0 ? (topAuthor.changes / file.totalChanges) * 100 : 0;

        return {
          entity: file.entity,
          owner: topAuthor.author,
          ownerAdded: topAuthor.added,
          ownerDeleted: topAuthor.deleted,
          ownerChanges: topAuthor.changes,
          totalChanges: file.totalChanges,
          ownershipPct,
        };
      })
      .sort((a, b) => b.ownershipPct - a.ownershipPct || b.ownerChanges - a.ownerChanges)
      .slice(0, 20);
  }, [data]);

  const tooltipFormatter = (value: number, name: string) => [value, name] as [number, string];

  const tooltipLabelFormatter = (
    _label: string,
    payload: Array<{ payload?: { topEntity?: string } }>
  ) => {
    const topEntity = payload?.[0]?.payload?.topEntity || '-';
    return `Top file changed: ${topEntity}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ownership</CardTitle>
        <Box sx={{ mt: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_event, value) => setActiveTab(value as 'by-author' | 'by-file')}
            textColor="secondary"
            indicatorColor="secondary"
            aria-label="ownership tabs"
          >
            <Tab value="by-author" label="By Author" />
            <Tab value="by-file" label="By File" />
          </Tabs>
        </Box>
        {activeTab === 'by-author' ? (
          <p className="mt-2 text-sm text-gray-600">
            Ranks contributors by total code changes. Green is lines added and red is lines deleted
            per author. Hover an author to see the file they changed the most.
          </p>
        ) : (
          <p className="mt-2 text-sm text-gray-600">
            For each file, shows the person who changed it the most (added + deleted), plus
            ownership percentage relative to all changes on that file.
          </p>
        )}
      </CardHeader>
      <CardContent>
        {activeTab === 'by-author' ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byAuthor}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="author" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={tooltipFormatter} labelFormatter={tooltipLabelFormatter} />
              <Legend />
              <Bar dataKey="added" stackId="a" fill="#82ca9d" name="Added" />
              <Bar dataKey="deleted" stackId="a" fill="#ff6b6b" name="Deleted" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">File</th>
                  <th className="text-left p-2">Top Owner</th>
                  <th className="text-right p-2">Owner Changes</th>
                  <th className="text-right p-2">Ownership</th>
                  <th className="text-right p-2">Added</th>
                  <th className="text-right p-2">Deleted</th>
                </tr>
              </thead>
              <tbody>
                {topOwnerByFile.map((row, idx) => (
                  <tr
                    key={`ownership-${row.entity}-${row.owner}-${idx}`}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="p-2 font-mono text-xs">{row.entity}</td>
                    <td className="p-2">{row.owner}</td>
                    <td className="p-2 text-right">{row.ownerChanges}</td>
                    <td className="p-2 text-right">{row.ownershipPct.toFixed(1)}%</td>
                    <td className="p-2 text-right text-green-700">{row.ownerAdded}</td>
                    <td className="p-2 text-right text-red-700">{row.ownerDeleted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
