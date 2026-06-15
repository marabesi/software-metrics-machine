'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ensureArray } from '@/server/utils/chartData';
import { CodeChurnData } from './types';
import { TargetInfo } from '@/components/charts/TargetInfo';

export default function CodeChurnOverTimeCard({ data }: { data: CodeChurnData[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Code Churn Over Time</CardTitle>
          <TargetInfo metric="code-churn" />
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Trend of code changes by date. Higher points mean more lines changed in that period.
        </p>
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
