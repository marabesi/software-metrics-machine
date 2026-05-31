'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { MostCommentedPRData } from './types';

interface MostCommentedPRsCardProps {
  data: MostCommentedPRData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip" style={{ backgroundColor: '#fff', border: '1px solid #ccc', padding: '10px' }}>
        <p className="label">{`PR: ${data.pull_request_title}`}</p>
        <p className="intro">{`Comments: ${data.comments_count}`}</p>
        <p className="url"><a href={data.pull_request_url} target="_blank" rel="noopener noreferrer">View PR</a></p>
      </div>
    );
  }
  return null;
};

const MostCommentedPRsCard: React.FC<MostCommentedPRsCardProps> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Most Commented Pull Requests</CardTitle>
      </CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data.sort((a, b) => b.comments_count - a.comments_count).slice(0, 10)}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="pull_request_title" angle={-45} textAnchor="end" height={100} />
              <YAxis dataKey="comments_count" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="comments_count" fill="#8884d8" name="Comments" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center text-gray-500">No data available for most commented pull requests.</div>
        )}
      </CardContent>
    </Card>
  );
};

export default MostCommentedPRsCard;
