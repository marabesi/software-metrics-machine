'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SonarqubeComponentChartData } from './types';

export default function SonarqubeComponentTreeTableCard({
  data,
}: {
  data: SonarqubeComponentChartData[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Component Tree Metrics</CardTitle>
        <p className="mt-2 text-sm text-gray-600">
          Detailed per-component metrics from SonarQube component tree (complexity, cognitive complexity,
          NLOC and coverage).
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Component</th>
                <th className="text-right p-2">Complexity</th>
                <th className="text-right p-2">Cognitive</th>
                <th className="text-right p-2">NLOC</th>
                <th className="text-right p-2">Coverage</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => (
                <tr key={`sq-component-${item.key}-${idx}`} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-mono text-xs">{item.name || item.key}</td>
                  <td className="p-2 text-right">{item.complexity.toFixed(0)}</td>
                  <td className="p-2 text-right">{item.cognitiveComplexity.toFixed(0)}</td>
                  <td className="p-2 text-right">{item.ncloc.toFixed(0)}</td>
                  <td className="p-2 text-right">{item.coverage.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
