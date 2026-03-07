'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { pipelineAPI } from '@/lib/api';
import { useFilters } from '@/components/filters/FiltersContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { buildPipelineApiParams } from '@/lib/utils/apiParams';
import { ensureArray } from '@/lib/utils/chartData';

export default function PipelineSection() {
  const { filters } = useFilters();
  const [jobsByStatus, setJobsByStatus] = useState<any[]>([]);
  const [runsDuration, setRunsDuration] = useState<any[]>([]);
  const [jobsAvgTime, setJobsAvgTime] = useState<any[]>([]);
  const [deploymentFrequency, setDeploymentFrequency] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const apiParams = buildPipelineApiParams(filters);
        const [jobs, duration, avgTime, deployment] = await Promise.all([
          pipelineAPI.jobsByStatus(apiParams),
          pipelineAPI.runsDuration(apiParams),
          pipelineAPI.jobsAverageTime(apiParams),
          pipelineAPI.deploymentFrequency(apiParams),
        ]);
        // Handle both direct array responses and wrapped responses
        setJobsByStatus(Array.isArray(jobs) ? jobs : jobs?.result || []);
        setRunsDuration(Array.isArray(duration) ? duration : duration?.result || []);
        setJobsAvgTime(Array.isArray(avgTime) ? avgTime : avgTime?.result || []);
        setDeploymentFrequency(Array.isArray(deployment) ? deployment : deployment?.result || []);
      } catch (error) {
        console.error('Error fetching pipeline data:', error);
        // Set empty arrays on error to prevent map errors
        setJobsByStatus([]);
        setRunsDuration([]);
        setJobsAvgTime([]);
        setDeploymentFrequency([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  if (loading) {
    return <div className="text-center p-8">Loading pipeline metrics...</div>;
  }

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
          <CardTitle>Deployment Frequency</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={ensureArray(deploymentFrequency)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#8884d8" name="Deployments" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Jobs by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Job Name</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-right p-2">Count</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(jobsByStatus) && jobsByStatus.map((job, idx) => (
                  <tr key={`job-${job.job_name}-${job.status}-${idx}`} className="border-b hover:bg-gray-50">
                    <td className="p-2">{job.job_name}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        job.status === 'success' ? 'bg-green-100 text-green-800' :
                        job.status === 'failure' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="p-2 text-right">{job.count}</td>
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
