'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ensureArray } from '@/server/utils/chartData';
import { AvgReviewTimeData } from './types';

export default function AverageReviewTimeCard({ data }: { data: AvgReviewTimeData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Average Review Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={ensureArray(data)}>
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
  );
}
