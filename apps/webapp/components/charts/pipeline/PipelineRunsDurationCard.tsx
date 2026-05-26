'use client';

import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import { Tab, Tabs } from '@mui/material';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ensureArray } from '@/server/utils/chartData';
import { RunsByDayData, RunsDurationData } from './types';

export default function PipelineRunsDurationCard({
  data,
  runsByDay,
}: {
  data: RunsDurationData[];
  runsByDay: RunsByDayData[];
}) {
  const [activeTab, setActiveTab] = useState<'duration' | 'daily-runs'>('duration');

  const sortedDailyRuns = useMemo(
    () => [...ensureArray<RunsByDayData>(runsByDay)].sort((a, b) => a.day.localeCompare(b.day)),
    [runsByDay],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline Runs Duration</CardTitle>
        <Box sx={{ mt: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_event, value) => setActiveTab(value as 'duration' | 'daily-runs')}
            textColor="secondary"
            indicatorColor="secondary"
            aria-label="pipeline runs tabs"
          >
            <Tab value="duration" label="Average Duration" />
            <Tab value="daily-runs" label="Runs by Day" />
          </Tabs>
        </Box>
        {activeTab === 'duration' ? (
          <p className="mt-2 text-sm text-gray-600">
            Aggregated average duration in minutes for each workflow.
          </p>
        ) : (
          <p className="mt-2 text-sm text-gray-600">
            Number of pipeline runs per day, useful to spot peaks and drops in execution activity.
          </p>
        )}
      </CardHeader>
      <CardContent>
        {activeTab === 'duration' ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ensureArray(data)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="workflow" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="avg_duration" fill="#8884d8" name="Avg Duration (min)" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sortedDailyRuns}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" angle={-45} textAnchor="end" height={100} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="runs" fill="#10b981" name="Runs" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
