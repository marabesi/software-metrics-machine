'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ensureArray } from '@/server/utils/chartData';
import { CodeChurnData } from './types';

export default function CodeChurnOverTimeCard({ data }: { data: CodeChurnData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Code Churn Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={ensureArray(data)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#8884d8" name="Lines Changed" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
