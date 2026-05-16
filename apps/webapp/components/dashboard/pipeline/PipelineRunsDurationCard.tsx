'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ensureArray } from '@/lib/utils/chartData';
import { RunsDurationData } from './types';

export default function PipelineRunsDurationCard({ data }: { data: RunsDurationData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline Runs Duration</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={ensureArray(data)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="workflow" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="avg_duration" fill="#8884d8" name="Avg Duration (min)" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
