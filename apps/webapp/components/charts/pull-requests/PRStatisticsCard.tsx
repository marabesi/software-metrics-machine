'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AvgCommentsData, SummaryData } from './types';

export default function PRStatisticsCard({
  summary,
  avgComments,
}: {
  summary: SummaryData | null;
  avgComments: AvgCommentsData | null;
}) {
  const labels = summary?.labels || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>PR Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Total PRs</p>
              <p className="text-3xl font-bold text-blue-600">{summary?.total_prs || 0}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Merged</p>
              <p className="text-3xl font-bold text-green-600">{summary?.merged_prs || 0}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Closed</p>
              <p className="text-3xl font-bold text-gray-600">{summary?.closed_prs || 0}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Avg Comments</p>
              <p className="text-3xl font-bold text-purple-600">{summary?.avg_comments_per_pr?.toFixed(2) || 0}</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600">Unique Authors</p>
              <p className="text-3xl font-bold text-orange-600">{summary?.unique_authors || 0}</p>
            </div>
            <div className="p-4 bg-pink-50 rounded-lg">
              <p className="text-sm text-gray-600">Unique Labels</p>
              <p className="text-3xl font-bold text-pink-600">{summary?.unique_labels || 0}</p>
            </div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Average Comments Per PR (Detailed)</p>
            <p className="text-3xl font-bold text-blue-600">{avgComments?.avg_comments?.toFixed(2) || 0}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Labels</p>

            {labels.length === 0 ? (
              <p className="text-sm text-gray-500">No labels available.</p>
            ) : (
              <ul className="space-y-2">
                {labels.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-center justify-between rounded border bg-white px-3 py-2"
                  >
                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                    <span className="text-sm text-slate-500">{item.prs} PRs</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
