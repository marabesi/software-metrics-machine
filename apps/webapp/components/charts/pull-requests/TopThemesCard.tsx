'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ensureArray } from '@/lib/utils/chartData';
import { ThemeData } from './types';

export default function TopThemesCard({ data }: { data: ThemeData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Themes</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={ensureArray(data)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="theme" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#ffc658" name="Occurrences" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
