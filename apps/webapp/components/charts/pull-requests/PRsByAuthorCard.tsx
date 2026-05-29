'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { ensureArray } from '@/server/utils/chartData';
import { ByAuthorData } from './types';
import { useLinkBuilder } from '@/components/providers/LinkBuilderContext';

export default function PRsByAuthorCard({ data }: { data: ByAuthorData[] }) {
  const { urlBuilder } = useLinkBuilder();

  const handleBarClick = (entry: ByAuthorData) => {
    const url = urlBuilder.getPRsUrl({ author: entry.author });
    window.open(url, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>PRs by Author</CardTitle>
        <p className="text-xs text-gray-500 mt-1">Click on bars to view author's PRs</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={ensureArray(data)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="author" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#8884d8" name="PR Count" onClick={(e) => handleBarClick(e.payload)} style={{ cursor: 'pointer' }} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
