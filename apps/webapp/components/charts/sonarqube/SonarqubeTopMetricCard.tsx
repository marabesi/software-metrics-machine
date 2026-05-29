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
import { useLinkBuilder } from '@/components/providers/LinkBuilderContext';

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
  const { urlBuilder } = useLinkBuilder();

  const handleBarClick = (entry: SonarqubeTopMetricData) => {
    if (entry.componentKey) {
      const url = urlBuilder.getSonarqubeComponentUrl(entry.componentKey);
      window.open(url, '_blank');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="mt-2 text-sm text-gray-600">{description}</p>
        {data.some(d => d.componentKey) && (
          <p className="text-xs text-gray-500 mt-1">Click on bars to view component in SonarQube</p>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={110} interval={0} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar 
              dataKey="value" 
              fill={color} 
              name={dataKeyLabel}
              onClick={(e) => data.some(d => d.componentKey) && handleBarClick(e.payload)}
              style={data.some(d => d.componentKey) ? { cursor: 'pointer' } : {}}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
