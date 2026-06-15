'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CouplingData } from './types';
import { TargetInfo } from '@/components/charts/TargetInfo';

export default function CodeCouplingCard({ data }: { data: CouplingData[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Code Coupling (Top 20)</CardTitle>
          <TargetInfo metric="code-coupling" />
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Lists file pairs that often change together. Higher Degree means stronger coupling;
          Avg. Revs indicates average shared revision activity.
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Entity</th>
                <th className="text-left p-2">Coupled With</th>
                <th className="text-right p-2">Degree</th>
                <th className="text-right p-2">Avg. Revs</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(data) && data.map((item, idx) => (
                <tr key={`coupling-${item.entity}-${item.coupled}-${idx}`} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-mono text-xs">{item.entity}</td>
                  <td className="p-2 font-mono text-xs">{item.coupled}</td>
                  <td className="p-2 text-right">
                    <span className="px-2 py-1 rounded bg-blue-100 text-blue-800">{item.degree}</span>
                  </td>
                  <td className="p-2 text-right">
                    <span className="px-2 py-1 rounded bg-green-100 text-green-800">{item.averageRevs}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
