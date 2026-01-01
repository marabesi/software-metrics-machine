'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { pullRequestAPI } from '@/lib/api';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function PullRequestsSection() {
  const [dateRange, setDateRange] = useState({ start_date: '', end_date: '' });
  const [byAuthor, setByAuthor] = useState<any[]>([]);
  const [avgReviewTime, setAvgReviewTime] = useState<any[]>([]);
  const [openThroughTime, setOpenThroughTime] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [author, review, open] = await Promise.all([
          pullRequestAPI.byAuthor(dateRange),
          pullRequestAPI.averageReviewTime(dateRange),
          pullRequestAPI.openThroughTime(dateRange),
        ]);
        setByAuthor(author);
        setAvgReviewTime(review);
        setOpenThroughTime(open);
      } catch (error) {
        console.error('Error fetching PR data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  if (loading) {
    return <div className="text-center p-8">Loading pull request metrics...</div>;
  }

  return (
    <div className="space-y-6">
      <DateRangePicker
        startDate={dateRange.start_date}
        endDate={dateRange.end_date}
        onChange={setDateRange}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>PRs by Author</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byAuthor}>
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
              <BarChart data={avgReviewTime}>
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
            <LineChart data={openThroughTime}>
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
    </div>
  );
}
