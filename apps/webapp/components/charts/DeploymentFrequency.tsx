'use client';

import { useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ensureArray } from '@/server/utils/chartData';
import { DeploymentFrequencyPoint } from '@/app/dashboard/insights/insights-types';
import { useConfiguration } from '../providers/ConfigurationContext';
import { useLinkBuilder } from '../providers/LinkBuilderContext';

export function DeploymentFrequency({ deploymentFrequency, monthTransitionIndices }: { deploymentFrequency: DeploymentFrequencyPoint[]; monthTransitionIndices: Array<{date: string, week_label: string, month_label: string}> }) {
  const configuration = useConfiguration();
  const configuredTargets = (configuration.deployment_frequency_targets || [])
    .filter((target) => target.pipeline && target.job);
  const singleTarget = configuredTargets.length === 1 ? configuredTargets[0] : null;
  const { urlBuilder } = useLinkBuilder();

  const handleClick = useCallback((date: string, granularity: 'day' | 'week' | 'month') => {
    if (!singleTarget) {
      return;
    }

    const workflowSegments = singleTarget.pipeline.split('/').filter(Boolean);
    const workflowFileName = workflowSegments.length > 0 ? workflowSegments[workflowSegments.length - 1] : singleTarget.pipeline;
    const url = urlBuilder.getActionPerformanceForJobUrl(singleTarget.job, workflowFileName, granularity, date);
    window.open(url, '_blank');
  }, [singleTarget, urlBuilder]);

  const DayDot = useCallback((props: any) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy || !singleTarget) return null;
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
  }, [handleClick, singleTarget]);

  const WeekDot = useCallback((props: any) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy || !singleTarget) return null;
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
  }, [handleClick, singleTarget]);

  const MonthDot = useCallback((props: any) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy || !singleTarget) return null;
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
  }, [handleClick, singleTarget]);

  return (
    <div style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
      {configuredTargets.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
          {configuredTargets.map((target) => (
            <span key={`${target.pipeline}:${target.job}`} className="rounded border px-2 py-1">
              {target.pipeline} / {target.job}
            </span>
          ))}
        </div>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={ensureArray(deploymentFrequency)}>
          <CartesianGrid strokeDasharray="3 3" />
          {monthTransitionIndices.map((transition) => (
            <ReferenceLine key={transition.date} x={transition.date} stroke="#000" strokeWidth={2} />
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
          {monthTransitionIndices.map((transition) => (
            <ReferenceLine key={transition.date} x={transition.date} stroke="#000" strokeWidth={2} />
          ))}
          <XAxis 
            dataKey="date" 
            angle={-45} 
            textAnchor="end" 
            height={100} 
            tickFormatter={(value) => {
              const point = deploymentFrequency.find(d => d.date === value);
              return point ? point.week_label : value;
            }}
          />
          <YAxis />
          <Tooltip labelFormatter={(value) => {
            const point = deploymentFrequency.find(d => d.date === value);
            return point ? point.week_label : value;
          }} />
          <Legend />
          <Line type="monotone" dataKey="week_count" stroke="#82ca9d" name="Weekly" dot={WeekDot} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={ensureArray(deploymentFrequency)}>
          <CartesianGrid strokeDasharray="3 3" />
          {monthTransitionIndices.map((transition) => (
            <ReferenceLine key={transition.date} x={transition.date} stroke="#000" strokeWidth={2} />
          ))}
          <XAxis 
            dataKey="date" 
            angle={-45} 
            textAnchor="end" 
            height={100} 
            tickFormatter={(value) => {
              const point = deploymentFrequency.find(d => d.date === value);
              return point ? point.month_label : value;
            }}
          />
          <YAxis />
          <Tooltip labelFormatter={(value) => {
            const point = deploymentFrequency.find(d => d.date === value);
            return point ? point.month_label : value;
          }} />
          <Legend />
          <Line type="monotone" dataKey="month_count" stroke="#ffc658" name="Monthly" dot={MonthDot} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
