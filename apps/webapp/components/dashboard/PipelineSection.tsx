'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { pipelineAPI } from '@/lib/api';
import { useFilters } from '@/components/filters/FiltersContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { buildPipelineApiParams } from '@/lib/utils/apiParams';
import { ensureArray } from '@/lib/utils/chartData';

type ResultWrapper<T> = {
  result: T;
};

interface JobByStatusResponseItem {
  Status?: string;
  Count?: number;
}

interface JobByStatusData {
  status: string;
  count: number;
}

interface RunsDurationResponseItem {
  workflow?: string;
  avg_duration?: number;
  name?: string;
  value?: number;
}

interface RunsDurationData {
  workflow: string;
  avg_duration: number;
  name?: string;
  value?: number;
}

interface JobsAverageTimeResponseItem {
  job_name?: string;
  avg_time?: number;
}

interface JobsAverageTimeData {
  job_name: string;
  avg_time: number;
}

function unwrapResult<T>(data: T | ResultWrapper<T>): T {
  if (typeof data === 'object' && data !== null && 'result' in data) {
    return data.result;
  }
  return data;
}

export default function PipelineSection() {
  const { filters } = useFilters();
  const [jobsByStatus, setJobsByStatus] = useState<JobByStatusData[]>([]);
  const [runsDuration, setRunsDuration] = useState<RunsDurationData[]>([]);
  const [jobsAvgTime, setJobsAvgTime] = useState<JobsAverageTimeData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiParams = buildPipelineApiParams(filters);
        const [jobs, duration, avgTime] = await Promise.all([
          pipelineAPI.jobsByStatus(apiParams),
          pipelineAPI.runsDuration(apiParams),
          pipelineAPI.jobsAverageTime(apiParams),
        ]);
        
        // Handle jobsByStatus - Status and Count fields
        const jobsResult = unwrapResult(jobs as JobByStatusResponseItem[] | ResultWrapper<JobByStatusResponseItem[]>);
        const jobsData = Array.isArray(jobsResult) ? jobsResult.map((j: JobByStatusResponseItem): JobByStatusData => ({
          status: (j.Status || 'unknown').toLowerCase(),
          count: j.Count || 0,
        })) : [];
        
        // Handle runsDuration - transform name/value to workflow/avg_duration
        const durationResult = unwrapResult(
          duration as RunsDurationResponseItem[] | ResultWrapper<RunsDurationResponseItem[]>
        );
        const durationData = Array.isArray(durationResult) ? durationResult.map((d: RunsDurationResponseItem): RunsDurationData => ({
          workflow: d.workflow || d.name || 'Unknown',
          avg_duration: d.avg_duration || d.value || 0,
          name: d.name,
          value: d.value
        })) : [];
        
        // Handle jobsAverageTime - unwrap if needed and transform
        let avgTimeData: JobsAverageTimeData[] = [];
        const avgTimeResult = unwrapResult(
          avgTime as JobsAverageTimeResponseItem[] | ResultWrapper<JobsAverageTimeResponseItem[]>
        );
        if (Array.isArray(avgTimeResult)) {
          avgTimeData = avgTimeResult.map((a: JobsAverageTimeResponseItem): JobsAverageTimeData => ({
            job_name: a.job_name || 'Unknown',
            avg_time: a.avg_time || 0
          }));
        }
        
        setJobsByStatus(jobsData);
        setRunsDuration(durationData);
        setJobsAvgTime(avgTimeData);
      } catch (error) {
        console.error('Error fetching pipeline data:', error);
        // Set empty arrays on error to prevent map errors
        setJobsByStatus([]);
        setRunsDuration([]);
        setJobsAvgTime([]);
      }
    };

    fetchData();
  }, [filters]);

  // if (loading) {
  //   return <div className="text-center p-8">Loading pipeline metrics...</div>;
  // }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Runs Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ensureArray(runsDuration)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="workflow" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avg_duration" fill="#8884d8" name="Avg Duration (min)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Jobs Average Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ensureArray(jobsAvgTime)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="job_name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avg_time" fill="#82ca9d" name="Avg Time (min)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Jobs by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Status</th>
                  <th className="text-right p-2">Count</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(jobsByStatus) && jobsByStatus.map((job, idx) => (
                  <tr key={`job-${idx}`} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        (job.status || '').toLowerCase() === 'success' ? 'bg-green-100 text-green-800' :
                        (job.status || '').toLowerCase() === 'failure' ? 'bg-red-100 text-red-800' :
                        (job.status || '').toLowerCase() === 'pending' || (job.status || '').toLowerCase() === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {job.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="p-2 text-right">{job.count || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
