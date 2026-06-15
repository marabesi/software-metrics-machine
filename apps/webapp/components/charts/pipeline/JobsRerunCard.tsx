'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { JobSummaryData, JobRerunsByDayData } from './types';
import { TargetInfo } from '@/components/charts/TargetInfo';

interface JobsRerunCardProps {
  data: JobSummaryData[];
  dataByDay: JobRerunsByDayData[];
}

export default function JobsRerunCard({ data, dataByDay }: JobsRerunCardProps) {
  const totalByDayReruns = dataByDay.reduce((sum, item) => sum + (item.rerun_count || 0), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Job Reruns</CardTitle>
          <TargetInfo metric="job-reruns" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-md border p-3 bg-gray-50">
            <div className="text-sm text-gray-600">Total reruns</div>
            <div className="text-2xl font-semibold text-gray-900">{totalByDayReruns}</div>
          </div>
          <div className="rounded-md border p-3 bg-gray-50">
            <div className="text-sm text-gray-600">Unique jobs</div>
            <div className="text-2xl font-semibold text-gray-900">{data.length}</div>
          </div>
        </div>

        {/* Time Series Chart */}
        {dataByDay && dataByDay.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-3 text-gray-700">Reruns by Day</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dataByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="rerun_count"
                  stroke="#ef4444"
                  name="Reruns"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Jobs Table */}
        <div>
          <div className="flex items-baseline gap-2 mb-3">
            <h3 className="text-sm font-medium text-gray-700">Jobs Summary</h3>
            <span className="text-xs text-gray-400">Failure rate = (failed / total runs) × 100</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Job</th>
                  <th className="text-right p-2">Total Runs</th>
                  <th className="text-right p-2">Success Rate</th>
                  <th className="text-right p-2">Failure Rate</th>
                  <th className="text-right p-2">Reruns</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(data) && data.map((item, idx) => (
                  <tr key={`job-rerun-${idx}`} className="border-b hover:bg-gray-50">
                    <td className="p-2 text-gray-800">{item.job_name || 'Unknown'}</td>
                    <td className="p-2 text-right">{item.total_runs || 0}</td>
                    <td className="p-2 text-right text-green-600">{(item.success_rate || 0).toFixed(1)}%</td>
                    <td className="p-2 text-right text-red-600">{(item.failure_rate || 0).toFixed(1)}%</td>
                    <td className="p-2 text-right font-medium text-red-600">{item.rerun_count || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
