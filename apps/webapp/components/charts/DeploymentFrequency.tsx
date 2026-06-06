'use client';

import { useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ensureArray } from '@/server/utils/chartData';
import { DeploymentFrequencyPoint } from '@/app/dashboard/insights/insights-types';
import { useConfiguration } from '../providers/ConfigurationContext';

export function DeploymentFrequency({ deploymentFrequency, monthTransitionIndices }: { deploymentFrequency: DeploymentFrequencyPoint[]; monthTransitionIndices: string[] }) {
  const githubRepository = useConfiguration().github_repository;
  const workflowPath = useConfiguration().deployment_frequency_target_pipeline || '';
  const jobName = useConfiguration().deployment_frequency_target_job || '';

  const computeRange = (dateStr: string, granularity: 'day' | 'week' | 'month') => {
    if (!dateStr || dateStr === 'Unknown') return null;
    const parts = dateStr.split('-').map((p) => Number(p));
    if (parts.length < 3) return null;
    const [year, month, day] = parts;
    const startUtc = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
    
    if (granularity === 'day') {
      const endUtc = startUtc + 24 * 60 * 60 * 1000 - 1;
      return { start: startUtc, end: endUtc };
    }
    if (granularity === 'week') {
      const d = new Date(Date.UTC(year, month - 1, day));
      const utcDay = d.getUTCDay();
      const diffToMonday = (utcDay + 6) % 7;
      const monday = new Date(d);
      monday.setUTCDate(d.getUTCDate() - diffToMonday);
      const mondayStart = Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate());
      const sundayEnd = mondayStart + 7 * 24 * 60 * 60 * 1000 - 1;
      return { start: mondayStart, end: sundayEnd };
    }
    const monthStart = Date.UTC(year, month - 1, 1);
    const nextMonthStart = Date.UTC(year, month, 1);
    const monthEnd = nextMonthStart - 1;
    return { start: monthStart, end: monthEnd };
  };

  const handleClick = useCallback((date: string, granularity: 'day' | 'week' | 'month') => {
    const workflowSegments = workflowPath.split('/').filter(Boolean);
    const workflowFileName = workflowSegments.length > 0 ? workflowSegments[workflowSegments.length - 1] : workflowPath;
    
    const range = computeRange(date, granularity);
    if (!range) return;
    
    const filterParam = encodeURIComponent(`workflow_file_name:${workflowFileName}`) + `+${encodeURIComponent('job_name:' + jobName)}`;
    console.log(filterParam);
    const url = `https://github.com/${githubRepository.replace(/\/$/, '')}/actions/metrics/usage?dateRangeType=DATE_RANGE_TYPE_CUSTOM&tab=jobs&filters=${filterParam}&range=${range.start}-${range.end}`;
    window.open(url, '_blank');
  }, [githubRepository, workflowPath, jobName]);

  const DayDot = useCallback((props: any) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy) return null;
    return (
      <g onClick={() => handleClick(payload?.date, 'day')} style={{ pointerEvents: 'auto' }}>
        <rect
          x={Number(cx) - 10}
          y={Number(cy) - 10}
          width={20}
          height={20}
          fill="transparent"
          style={{ cursor: 'pointer', pointerEvents: 'auto' }}
        />
      </g>
    );
  }, [handleClick]);

  const WeekDot = useCallback((props: any) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy) return null;
    return (
      <g onClick={() => handleClick(payload?.date, 'week')} style={{ pointerEvents: 'auto' }}>
        <rect
          x={Number(cx) - 10}
          y={Number(cy) - 10}
          width={20}
          height={20}
          fill="transparent"
          style={{ cursor: 'pointer', pointerEvents: 'auto' }}
        />
      </g>
    );
  }, [handleClick]);

  const MonthDot = useCallback((props: any) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy) return null;
    return (
      <g onClick={() => handleClick(payload?.date, 'month')} style={{ pointerEvents: 'auto' }}>
        <rect
          x={Number(cx) - 10}
          y={Number(cy) - 10}
          width={20}
          height={20}
          fill="transparent"
          style={{ cursor: 'pointer', pointerEvents: 'auto' }}
        />
      </g>
    );
  }, [handleClick]);

  return (
    <div style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={ensureArray(deploymentFrequency)}>
          <CartesianGrid strokeDasharray="3 3" />
          {monthTransitionIndices.map((date) => (
            <ReferenceLine key={date} x={date} stroke="#000" strokeWidth={2} />
          ))}
          <XAxis dataKey="date" angle={-45} textAnchor="end" height={100} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="day_count" stroke="#8884d8" name="Daily" dot={DayDot} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={ensureArray(deploymentFrequency)}>
          <CartesianGrid strokeDasharray="3 3" />
          {monthTransitionIndices.map((date) => (
            <ReferenceLine key={date} x={date} stroke="#000" strokeWidth={2} />
          ))}
          <XAxis dataKey="date" angle={-45} textAnchor="end" height={100} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="week_count" stroke="#82ca9d" name="Weekly" dot={WeekDot} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={ensureArray(deploymentFrequency)}>
          <CartesianGrid strokeDasharray="3 3" />
          {monthTransitionIndices.map((date) => (
            <ReferenceLine key={date} x={date} stroke="#000" strokeWidth={2} />
          ))}
          <XAxis dataKey="date" angle={-45} textAnchor="end" height={100} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="month_count" stroke="#ffc658" name="Monthly" dot={MonthDot} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}