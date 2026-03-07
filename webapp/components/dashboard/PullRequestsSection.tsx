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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const apiParams = buildPullRequestApiParams(filters);
        const [author, review, open, openBy, comments] = await Promise.all([
          pullRequestAPI.byAuthor(apiParams),
          pullRequestAPI.averageReviewTime(apiParams),
          pullRequestAPI.openThroughTime(apiParams),
          pullRequestAPI.averageOpenBy(apiParams),
          pullRequestAPI.averageComments(apiParams),
        ]);
        // Handle both direct array responses and wrapped responses
        setByAuthor(Array.isArray(author) ? author : author?.result || []);
        setAvgReviewTime(Array.isArray(review) ? review : review?.result || []);
        setOpenThroughTime(Array.isArray(open) ? open : open?.result || []);
        setAvgOpenBy(Array.isArray(openBy) ? openBy : openBy?.result || []);
        setAvgComments(comments?.result !== undefined ? comments.result : comments);
      } catch (error) {
        console.error('Error fetching PR data:', error);
        // Set empty arrays on error
        setByAuthor([]);
        setAvgReviewTime([]);
        setOpenThroughTime([]);
        setAvgOpenBy([]);
        setAvgComments(null);
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
                <Bar dataKey="avg_hours" fill="#82ca9d" name="Avg Hours" />
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
              <Line type="monotone" dataKey="open_prs" stroke="#8884d8" name="Open PRs" />
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
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Average Comments Per PR</p>
                <p className="text-3xl font-bold text-blue-600">
                  {avgComments?.avg_comments?.toFixed(2) || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
