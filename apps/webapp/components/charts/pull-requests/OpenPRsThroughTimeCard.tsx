'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ensureArray } from '@/server/utils/chartData';
import { OpenThroughTimeData } from './types';

export default function OpenPRsThroughTimeCard({ data }: { data: OpenThroughTimeData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Open PRs Through Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={ensureArray(data)}>
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
  );
}
