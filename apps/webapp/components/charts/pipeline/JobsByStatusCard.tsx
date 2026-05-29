'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { JobByStatusData } from './types';
import { useLinkBuilder } from '@/components/providers/LinkBuilderContext';

export default function JobsByStatusCard({ data }: { data: JobByStatusData[] }) {
  const { urlBuilder } = useLinkBuilder();

  const getStatusColor = (status: string) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower === 'success') {
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    } else if (statusLower === 'failure') {
      return 'bg-red-100 text-red-800 hover:bg-red-200';
    } else if (statusLower === 'pending' || statusLower === 'in_progress') {
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    }
    return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Jobs by Status</CardTitle>
        <p className="text-xs text-gray-500 mt-1">Click to view pipeline runs with this status</p>
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
                    <a
                      href={urlBuilder.getPipelinesUrl({ status: job.status })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-2 py-1 rounded text-xs font-medium inline-block transition-colors ${getStatusColor(job.status)}`}
                    >
                      {job.status || 'Unknown'}
                    </a>
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
