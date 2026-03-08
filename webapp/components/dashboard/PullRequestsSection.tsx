'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { pullRequestAPI } from '@/lib/api';
import { useFilters } from '@/components/filters/FiltersContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { buildPullRequestApiParams } from '@/lib/utils/apiParams';
import { ensureArray } from '@/lib/utils/chartData';

export default function PullRequestsSection() {
  const { filters } = useFilters();
  const [byAuthor, setByAuthor] = useState<any[]>([]);
  const [avgReviewTime, setAvgReviewTime] = useState<any[]>([]);
  const [openThroughTime, setOpenThroughTime] = useState<any[]>([]);
  const [avgOpenBy, setAvgOpenBy] = useState<any[]>([]);
  const [avgComments, setAvgComments] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const apiParams = buildPullRequestApiParams(filters);
        const [author, review, open, openBy, comments, summaryData] = await Promise.all([
          pullRequestAPI.byAuthor(apiParams),
          pullRequestAPI.averageReviewTime(apiParams),
          pullRequestAPI.openThroughTime(apiParams),
          pullRequestAPI.averageOpenBy(apiParams),
          pullRequestAPI.averageComments(apiParams),
          pullRequestAPI.summary(apiParams),
        ]);
        // Handle both direct array responses and wrapped responses
        setByAuthor(Array.isArray(author) ? author : ((author as any)?.result || []));
        setAvgReviewTime(Array.isArray(review) ? review : ((review as any)?.result || []));
        let openData = Array.isArray(open) ? open : ((open as any)?.result || []);
        // Transform data: group by date and pivot kind into opened/closed
        if (openData.length > 0) {
          const grouped = openData.reduce((acc: any, item: any) => {
            const existing = acc.find((d: any) => d.date === item.date);
            if (existing) {
              if (item.kind === 'Opened') {
                existing.opened = item.count;
              } else if (item.kind === 'Closed') {
                existing.closed = item.count;
              }
            } else {
              acc.push({
                date: item.date,
                opened: item.kind === 'Opened' ? item.count : 0,
                closed: item.kind === 'Closed' ? item.count : 0,
              });
            }
            return acc;
          }, []);
          openData = grouped;
        }
        setOpenThroughTime(openData);
        setAvgOpenBy(Array.isArray(openBy) ? openBy : ((openBy as any)?.result || []));
        setAvgComments((comments as any)?.result !== undefined ? (comments as any).result : comments);
        setSummary((summaryData as any)?.result !== undefined ? (summaryData as any).result : summaryData);
      } catch (error) {
        console.error('Error fetching PR data:', error);
        // Set empty arrays on error
        setByAuthor([]);
        setAvgReviewTime([]);
        setOpenThroughTime([]);
        setAvgOpenBy([]);
        setAvgComments(null);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  if (loading) {
    return <div className="text-center p-8">Loading pull request metrics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>PRs by Author</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ensureArray(byAuthor)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="author" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name="PR Count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Review Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ensureArray(avgReviewTime)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="author" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avg_days" fill="#82ca9d" name="Avg Days" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Open PRs Through Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={ensureArray(openThroughTime)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="opened" stroke="#8884d8" name="Opened" />
              <Line type="monotone" dataKey="closed" stroke="#82ca9d" name="Closed" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Average Days PRs Remain Open</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={ensureArray(avgOpenBy)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="avg_days" stroke="#82ca9d" name="Avg Days Open" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>PR Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total PRs</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {summary?.total_prs || 0}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Merged</p>
                  <p className="text-3xl font-bold text-green-600">
                    {summary?.merged_prs || 0}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Closed</p>
                  <p className="text-3xl font-bold text-gray-600">
                    {summary?.closed_prs || 0}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Avg Comments</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {summary?.avg_comments_per_pr?.toFixed(2) || 0}
                  </p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-gray-600">Unique Authors</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {summary?.unique_authors || 0}
                  </p>
                </div>
                <div className="p-4 bg-pink-50 rounded-lg">
                  <p className="text-sm text-gray-600">Unique Labels</p>
                  <p className="text-3xl font-bold text-pink-600">
                    {summary?.unique_labels || 0}
                  </p>
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Average Comments Per PR (Detailed)</p>
                <p className="text-3xl font-bold text-blue-600">
                  {avgComments?.avg_comments?.toFixed(2) || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
