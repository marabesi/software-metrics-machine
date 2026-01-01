'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { pipelineAPI } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function PipelineSection() {
  const [dateRange, setDateRange] = useState({ start_date: '', end_date: '' });
  const [jobsByStatus, setJobsByStatus] = useState<any[]>([]);
  const [runsDuration, setRunsDuration] = useState<any[]>([]);
  const [jobsAvgTime, setJobsAvgTime] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [jobs, duration, avgTime] = await Promise.all([
          pipelineAPI.jobsByStatus(dateRange),
          pipelineAPI.runsDuration(dateRange),
          pipelineAPI.jobsAverageTime(dateRange),
        ]);
        setJobsByStatus(jobs);
        setRunsDuration(duration);
        setJobsAvgTime(avgTime);
      } catch (error) {
        console.error('Error fetching pipeline data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

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
              <BarChart data={runsDuration}>
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
              <BarChart data={jobsAvgTime}>
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
                  <th className="text-left p-2">Job Name</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-right p-2">Count</th>
                </tr>
              </thead>
              <tbody>
                {jobsByStatus.map((job, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
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
