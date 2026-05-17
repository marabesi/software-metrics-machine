'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ensureArray } from '@/lib/utils/chartData';
import { JobsAverageTimeData } from './types';

export default function JobsAverageTimeCard({ data }: { data: JobsAverageTimeData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Jobs Average Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={ensureArray(data)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="job_name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="avg_time" fill="#82ca9d" name="Avg Time (min)" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
