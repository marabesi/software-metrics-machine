'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { JobByStatusData } from './types';

export default function JobsByStatusCard({ data }: { data: JobByStatusData[] }) {
  return (
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
              {Array.isArray(data) && data.map((job, idx) => (
                <tr key={`job-${idx}`} className="border-b hover:bg-gray-50">
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${(job.status || '').toLowerCase() === 'success'
                        ? 'bg-green-100 text-green-800'
                        : (job.status || '').toLowerCase() === 'failure'
                          ? 'bg-red-100 text-red-800'
                          : (job.status || '').toLowerCase() === 'pending' || (job.status || '').toLowerCase() === 'in_progress'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                    >
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
  );
}
