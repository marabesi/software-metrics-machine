'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CouplingData } from './types';

export default function CodeCouplingCard({ data }: { data: CouplingData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Code Coupling (Top 20)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Entity</th>
                <th className="text-left p-2">Coupled With</th>
                <th className="text-right p-2">Degree</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
