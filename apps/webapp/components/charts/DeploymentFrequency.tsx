'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ensureArray } from '@/lib/utils/chartData';
import { DeploymentFrequencyPoint } from '@/app/dashboard/insights/insights-types';

export function DeploymentFrequency({ deploymentFrequency, monthTransitionIndices }: { deploymentFrequency: DeploymentFrequencyPoint[]; monthTransitionIndices: string[] }) {
  return (
    <>
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
          <Line type="monotone" dataKey="day_count" stroke="#8884d8" name="Daily" dot={false} isAnimationActive={false} />
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
          <Line type="monotone" dataKey="week_count" stroke="#82ca9d" name="Weekly" dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="month_count" stroke="#ffc658" name="Monthly" dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </>
  )
}