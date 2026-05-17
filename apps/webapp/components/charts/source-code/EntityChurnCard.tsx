'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ensureArray } from '@/server/utils/chartData';
import { EntityChurnData } from './types';

export default function EntityChurnCard({
  data,
  topEntries,
}: {
  data: EntityChurnData[];
  topEntries: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Entity Churn (Top {topEntries})</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={ensureArray(data)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="entity" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="added" stackId="a" fill="#82ca9d" name="Added" />
            <Bar dataKey="deleted" stackId="a" fill="#ff6b6b" name="Deleted" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
