'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ensureArray } from '@/server/utils/chartData';
import { AvgOpenByData } from './types';

export default function AverageDaysPRsRemainOpenCard({ data }: { data: AvgOpenByData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Average Days PRs Remain Open</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={ensureArray(data)}>
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
  );
}
