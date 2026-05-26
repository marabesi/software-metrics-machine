'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SonarqubeTopMetricData } from './types';

export default function SonarqubeTopMetricCard({
  title,
  description,
  data,
  dataKeyLabel,
  color,
}: {
  title: string;
  description: string;
  data: SonarqubeTopMetricData[];
  dataKeyLabel: string;
  color: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="mt-2 text-sm text-gray-600">{description}</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={110} interval={0} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill={color} name={dataKeyLabel} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
