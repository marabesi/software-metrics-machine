'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { JobStepsAverageTimeData, JobStepsAverageTimeByDayData } from './types';

// Generate a sequence of colors for the stacked bars
const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', 
  '#d0ed57', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c'
];

export default function JobStepsAnalysis({
  data,
  dataByDay,
  jobName,
}: {
  data: JobStepsAverageTimeData[];
  dataByDay: JobStepsAverageTimeByDayData[];
  jobName: string;
}) {
  const totalTime = useMemo(() => {
    return data.reduce((sum, step) => sum + step.averageDurationMinutes, 0);
  }, [data]);

  if (!data || data.length === 0) {
    return null;
  }

  const formatTime = (minutes: number) => {
    if (minutes < 1) {
      return `${Math.round(minutes * 60)}s`;
    }
    return `${minutes.toFixed(2)}m`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Steps Analysis: {jobName}</CardTitle>
        <p className="text-sm text-gray-500">
          Average execution time of each step across {data[0]?.count || 0} runs.
          Total average time: {formatTime(totalTime)}.
        </p>
      </CardHeader>
      <CardContent>
        {/* Daily Stacked Bar Chart showing step durations over time */}
        {dataByDay && dataByDay.length > 0 && (
          <div className="h-64 mb-10">
            <h4 className="text-sm font-semibold mb-4 text-gray-700">Average Duration By Day</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dataByDay}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis 
                  tickFormatter={(value) => formatTime(Number(value) || 0)}
                />
                <Tooltip 
                  formatter={(value: any, name: any) => [formatTime(Number(value) || 0), name]}
                  wrapperStyle={{ zIndex: 1000 }}
                />
                <Legend />
                {data.map((step, index) => (
                  <Bar 
                    key={step.name} 
                    dataKey={step.name} 
                    stackId="a" 
                    fill={COLORS[index % COLORS.length]} 
                    name={step.name}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Overall Proportions Stacked Bar Chart */}
        {/* <div className="h-48 mb-6">
          <h4 className="text-sm font-semibold mb-4 text-gray-700">Overall Time Proportion</h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" hide />
              <Tooltip 
                formatter={(value: any, name: any) => [formatTime(Number(value) || 0), name]}
              />
              {data.map((step, index) => (
                <Bar 
                  key={step.name} 
                  dataKey={step.name} 
                  stackId="a" 
                  fill={COLORS[index % COLORS.length]} 
                  name={step.name}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div> */}

        {/* Breakdown List */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="p-3 font-medium text-gray-600">Step Name</th>
                <th className="p-3 font-medium text-gray-600 text-right">Average Time</th>
                <th className="p-3 font-medium text-gray-600 text-right">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {data.map((step, index) => {
                const percentage = totalTime > 0 ? (step.averageDurationMinutes / totalTime) * 100 : 0;
                return (
                  <tr key={step.name} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                        />
                        <span className="font-medium text-gray-800">{step.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-right tabular-nums">
                      {formatTime(step.averageDurationMinutes)}
                    </td>
                    <td className="p-3 text-right tabular-nums text-gray-600">
                      {percentage.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}