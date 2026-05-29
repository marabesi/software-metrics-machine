'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ensureArray } from '@/server/utils/chartData';
import { JobsAverageTimeData } from './types';
import { useLinkBuilder } from '@/components/providers/LinkBuilderContext';

export default function JobsAverageTimeCard({ data }: { data: JobsAverageTimeData[] }) {
  const { urlBuilder } = useLinkBuilder();

  const handleBarClick = (entry: JobsAverageTimeData) => {
    const url = urlBuilder.getJobRunsUrl(entry.job_name);
    window.open(url, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Jobs Average Time</CardTitle>
        <p className="text-xs text-gray-500 mt-1">Click on bars to view job runs</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={ensureArray(data)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="job_name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="avg_time" fill="#82ca9d" name="Avg Time (min)" onClick={(e) => handleBarClick(e.payload)} style={{ cursor: 'pointer' }} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
