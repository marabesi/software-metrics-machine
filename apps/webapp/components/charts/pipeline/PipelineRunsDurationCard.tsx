'use client';

import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import { Tab, Tabs } from '@mui/material';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Scatter, ComposedChart } from 'recharts';
import { ensureArray } from '@/server/utils/chartData';
import { JobsDurationByWorkflowItem, RunsByDayData, RunsDurationData } from './types';
import { useLinkBuilder } from '@/components/providers/LinkBuilderContext';

type ActiveTab = 'duration' | 'job-breakdown' | 'daily-runs';

interface TooltipPayloadEntry {
  name?: string;
  value?: number;
  color?: string;
  dataKey?: string;
}

// Stable palette for up to 20 jobs
const JOB_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6',
  '#8b5cf6', '#14b8a6', '#f97316', '#ec4899', '#84cc16',
  '#06b6d4', '#a855f7', '#eab308', '#22c55e', '#f43f5e',
  '#0ea5e9', '#d946ef', '#fb923c', '#4ade80', '#38bdf8',
];

export default function PipelineRunsDurationCard({
  dataByAggregation,
  runsByDay,
  jobsDurationByWorkflow,
}: {
  dataByAggregation: Record<'avg' | 'min' | 'max', RunsDurationData[]>;
  runsByDay: RunsByDayData[];
  jobsDurationByWorkflow: JobsDurationByWorkflowItem[];
}) {
  const { urlBuilder } = useLinkBuilder();
  const [activeTab, setActiveTab] = useState<ActiveTab>('duration');

  const sortedDailyRuns = useMemo(
    () => [...ensureArray<RunsByDayData>(runsByDay)].sort((a, b) => a.day.localeCompare(b.day)),
    [runsByDay],
  );

  const sourceData = useMemo(
    () => ensureArray<RunsDurationData>(dataByAggregation.avg || []),
    [dataByAggregation],
  );

  // Min-Max range chart data (existing)
  const durationRangeData = useMemo(
    () => sourceData.map((item) => ({
      workflow: item.workflow,
      min: item.min_duration,
      max: item.max_duration,
      range: Math.max(0, item.max_duration - item.min_duration),
      avg: item.avg_duration,
    })),
    [sourceData],
  );

  // Job breakdown: one row per workflow, each job is a key with its avg duration
  const { jobBreakdownData, allJobNames } = useMemo(() => {
    const rows = ensureArray<JobsDurationByWorkflowItem>(jobsDurationByWorkflow);
    const jobBreakdownData = rows.map((row) => ({
      workflow: row.workflow,
      ...row.jobs, // only include jobs that belong to this workflow
    }));
    
    // Collect unique job names that exist across all workflows
    const jobSet = new Set<string>();
    for (const row of jobBreakdownData) {
      for (const key of Object.keys(row)) {
        if (key !== 'workflow') {
          jobSet.add(key);
        }
      }
    }
    const allJobNames = Array.from(jobSet).sort();
    return { jobBreakdownData, allJobNames };
  }, [jobsDurationByWorkflow]);

  const DurationTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadEntry[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow">
          <p className="font-semibold">{label}</p>
          {payload.map((entry, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value} min
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const JobBreakdownTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadEntry[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow">
          <p className="font-semibold">{label}</p>
          {payload.map((entry, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value} min
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline Runs Duration</CardTitle>
        <Box sx={{ mt: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_event, value) => setActiveTab(value as ActiveTab)}
            textColor="secondary"
            indicatorColor="secondary"
            aria-label="pipeline runs tabs"
          >
            <Tab value="duration" label="Min-Max Range" />
            <Tab value="job-breakdown" label="Job Breakdown" />
            <Tab value="daily-runs" label="Runs by Day" />
          </Tabs>
        </Box>
        {activeTab === 'duration' && (
          <p className="mt-2 text-sm text-gray-600">
            Min-Max duration range in minutes for each workflow, with average marked as a point. Click workflow names below to view runs.
          </p>
        )}
        {activeTab === 'job-breakdown' && (
          <p className="mt-2 text-sm text-gray-600">
            Average duration of each job per workflow, stacked to show the total pipeline runtime composition.
          </p>
        )}
        {activeTab === 'daily-runs' && (
          <p className="mt-2 text-sm text-gray-600">
            Number of pipeline runs per day, useful to spot peaks and drops in execution activity.
          </p>
        )}
      </CardHeader>
      <CardContent>
        {activeTab === 'duration' && (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={durationRangeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="workflow" angle={-45} textAnchor="end" height={100} />
                <YAxis unit=" min" />
                <Tooltip content={<DurationTooltip />} />
                <Legend />
                <Bar dataKey="min" stackId="r" fill="rgba(0,0,0,0)" stroke="rgba(0,0,0,0)" legendType="none" />
                <Bar dataKey="range" stackId="r" fill="#93c5fd" name="Min-Max Range (min)" />
                <Scatter dataKey="avg" fill="#1d4ed8" name="Avg (min)" />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Workflow</th>
                    <th className="text-right p-2">Avg (min)</th>
                    <th className="text-right p-2">Min (min)</th>
                    <th className="text-right p-2">Max (min)</th>
                  </tr>
                </thead>
                <tbody>
                  {durationRangeData.map((item, idx) => (
                    <tr key={`workflow-${idx}`} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <a
                          href={urlBuilder.getPipelinesUrl({ workflow: item.workflow })}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {item.workflow}
                        </a>
                      </td>
                      <td className="p-2 text-right">{item.avg.toFixed(2)}</td>
                      <td className="p-2 text-right">{item.min.toFixed(2)}</td>
                      <td className="p-2 text-right">{item.max.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'job-breakdown' && (
          <ResponsiveContainer width="100%" height={Math.max(300, jobBreakdownData.length * 60)}>
            <BarChart data={jobBreakdownData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" unit=" min" />
              <YAxis type="category" dataKey="workflow" width={180} />
              <Tooltip content={<JobBreakdownTooltip />} />
              <Legend />
              {allJobNames.map((name, i) => (
                <Bar
                  key={name}
                  dataKey={name}
                  stackId="jobs"
                  fill={JOB_COLORS[i % JOB_COLORS.length]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'daily-runs' && (
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

