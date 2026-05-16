'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { pullRequestAPI } from '@/lib/api';
import { useFilters } from '@/components/filters/FiltersContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { buildPullRequestApiParams } from '@/lib/utils/apiParams';
import { ensureArray } from '@/lib/utils/chartData';

type ResultWrapper<T> = {
  result: T;
};

interface ByAuthorData {
  author: string;
  count: number;
}

interface AvgReviewTimeData {
  author: string;
  avg_days?: number;
  avg_hours?: number;
}

interface OpenThroughTimeResponseItem {
  date: string;
  kind?: 'Opened' | 'Closed';
  count?: number;
  open_prs?: number;
}

interface OpenThroughTimeData {
  date: string;
  opened: number;
  closed: number;
}

interface AvgOpenByData {
  period: string;
  avg_days: number;
}

interface AvgCommentsData {
  avg_comments: number;
}

interface ThemeData {
  theme: string;
  count: number;
}

interface SummaryData {
  total_prs?: number;
  merged_prs?: number;
  closed_prs?: number;
  open_prs?: number;
  avg_comments_per_pr?: number;
  unique_authors?: number;
  unique_labels?: number;
  top_themes?: ThemeData[];
}

function unwrapResult<T>(data: T | ResultWrapper<T>): T {
  if (typeof data === 'object' && data !== null && 'result' in data) {
    return data.result;
  }
  return data;
}

export default function PullRequestsSection() {
  const { filters } = useFilters();
  const [byAuthor, setByAuthor] = useState<ByAuthorData[]>([]);
  const [avgReviewTime, setAvgReviewTime] = useState<AvgReviewTimeData[]>([]);
  const [openThroughTime, setOpenThroughTime] = useState<OpenThroughTimeData[]>([]);
  const [avgOpenBy, setAvgOpenBy] = useState<AvgOpenByData[]>([]);
  const [avgComments, setAvgComments] = useState<AvgCommentsData | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [topThemes, setTopThemes] = useState<ThemeData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
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
        setByAuthor(ensureArray<ByAuthorData>(unwrapResult(author as ByAuthorData[] | ResultWrapper<ByAuthorData[]>)));
        setAvgReviewTime(ensureArray<AvgReviewTimeData>(unwrapResult(review as AvgReviewTimeData[] | ResultWrapper<AvgReviewTimeData[]>)));
        let openData = ensureArray<OpenThroughTimeResponseItem>(
          unwrapResult(open as OpenThroughTimeResponseItem[] | ResultWrapper<OpenThroughTimeResponseItem[]>)
        );
        // Transform data: group by date and pivot kind into opened/closed
        if (openData.length > 0) {
          const grouped = openData.reduce((acc: OpenThroughTimeData[], item: OpenThroughTimeResponseItem) => {
            const existing = acc.find((d: OpenThroughTimeData) => d.date === item.date);
            if (existing) {
              if (item.kind === 'Opened') {
                existing.opened = item.count || 0;
              } else if (item.kind === 'Closed') {
                existing.closed = item.count || 0;
              }
            } else {
              acc.push({
                date: item.date,
                opened: item.kind === 'Opened' ? (item.count || 0) : 0,
                closed: item.kind === 'Closed' ? (item.count || 0) : 0,
              });
            }
            return acc;
          }, []);
          openData = grouped;
        } else {
          openData = openData.map((item): OpenThroughTimeData => ({
            date: item.date,
            opened: item.open_prs || 0,
            closed: 0,
          }));
        }
        setOpenThroughTime(openData);
        setAvgOpenBy(ensureArray<AvgOpenByData>(unwrapResult(openBy as AvgOpenByData[] | ResultWrapper<AvgOpenByData[]>)));
        setAvgComments(unwrapResult(comments as AvgCommentsData | ResultWrapper<AvgCommentsData>));
        const summaryResult = unwrapResult(summaryData as SummaryData | ResultWrapper<SummaryData>);
        setSummary(summaryResult);
        // Extract top themes from summary and limit to top 10
        const themes = summaryResult?.top_themes || [];
        setTopThemes(Array.isArray(themes) ? themes.slice(0, 10) : []);
      } catch (error) {
        console.error('Error fetching PR data:', error);
        // Set empty arrays on error
        setByAuthor([]);
        setAvgReviewTime([]);
        setOpenThroughTime([]);
        setAvgOpenBy([]);
        setAvgComments(null);
        setSummary(null);
        setTopThemes([]);
      }
    };

    fetchData();
  }, [filters]);

  // if (loading) {
  //   return <div className="text-center p-8">Loading pull request metrics...</div>;
  // }

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

      <Card>
        <CardHeader>
          <CardTitle>Top Themes</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ensureArray(topThemes)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="theme" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#ffc658" name="Occurrences" />
            </BarChart>
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
