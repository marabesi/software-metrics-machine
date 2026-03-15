'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { pipelineAPI } from '@/lib/api';
import { useFilters } from '@/components/filters/FiltersContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { buildPipelineApiParams } from '@/lib/utils/apiParams';
import { ensureArray } from '@/lib/utils/chartData';

export default function PipelineSection() {
  const { filters } = useFilters();
  const [jobsByStatus, setJobsByStatus] = useState<any[]>([]);
  const [runsDuration, setRunsDuration] = useState<any[]>([]);
  const [jobsAvgTime, setJobsAvgTime] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const apiParams = buildPipelineApiParams(filters);
        const [jobs, duration, avgTime] = await Promise.all([
          pipelineAPI.jobsByStatus(apiParams),
          pipelineAPI.runsDuration(apiParams),
          pipelineAPI.jobsAverageTime(apiParams),
        ]);
        
        // Handle jobsByStatus - Status and Count fields
        const jobsData = Array.isArray(jobs) ? jobs.map((j: any) => ({
          status: (j.Status || 'unknown').toLowerCase(),
          count: j.Count || 0,
        })) : [];
        
        // Handle runsDuration - transform name/value to workflow/avg_duration
        const durationData = Array.isArray(duration) ? duration.map((d: any) => ({
          workflow: d.workflow || d.name || 'Unknown',
          avg_duration: d.avg_duration || d.value || 0,
          name: d.name,
          value: d.value
        })) : ((duration as any)?.result || []);
        
        // Handle jobsAverageTime - unwrap if needed and transform
        let avgTimeData = [];
        if (Array.isArray(avgTime)) {
          avgTimeData = avgTime.map((a: any) => ({
            job_name: a.job_name || 'Unknown',
            avg_time: a.avg_time || 0
          }));
        } else if ((avgTime as any)?.result && Array.isArray((avgTime as any).result)) {
          avgTimeData = (avgTime as any).result.map((a: any) => ({
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
      } finally {
        setLoading(false);
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
