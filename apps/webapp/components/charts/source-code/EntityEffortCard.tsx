'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ensureArray } from '@/lib/utils/chartData';
import { EntityEffortData } from './types';

export default function EntityEffortCard({
  data,
  topEntries,
}: {
  data: EntityEffortData[];
  topEntries: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Entity Effort (Top {topEntries})</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={ensureArray(data)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="entity" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total-revs" fill="#8884d8" name="Total Revisions" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
