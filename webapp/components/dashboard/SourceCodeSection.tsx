'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { sourceCodeAPI } from '@/lib/api';
import { useFilters } from '@/components/filters/FiltersContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, LineChart, Line } from 'recharts';
import { buildSourceCodeApiParams } from '@/lib/utils/apiParams';
import { ensureArray } from '@/lib/utils/chartData';

export default function SourceCodeSection() {
  const { filters } = useFilters();
  const [entityChurn, setEntityChurn] = useState<any[]>([]);
  const [coupling, setCoupling] = useState<any[]>([]);
  const [entityEffort, setEntityEffort] = useState<any[]>([]);
  const [codeChurn, setCodeChurn] = useState<any[]>([]);
  const [entityOwnership, setEntityOwnership] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const apiParams = buildSourceCodeApiParams(filters);
        const [churn, coup, effort, churnOverTime, ownership] = await Promise.all([
          sourceCodeAPI.entityChurn(apiParams),
          sourceCodeAPI.coupling(apiParams),
          sourceCodeAPI.entityEffort(apiParams),
          sourceCodeAPI.codeChurn(apiParams),
          sourceCodeAPI.entityOwnership(apiParams),
        ]);
        // Handle both direct array responses and wrapped responses
        setEntityChurn(Array.isArray(churn) ? churn : ((churn as any)?.result || []));
        setCoupling(Array.isArray(coup) ? coup : ((coup as any)?.result || []));
        setEntityEffort(Array.isArray(effort) ? effort : ((effort as any)?.result || []));
        setCodeChurn(Array.isArray(churnOverTime) ? churnOverTime : ((churnOverTime as any)?.result || []));
        setEntityOwnership(Array.isArray(ownership) ? ownership : ((ownership as any)?.result || []));
      } catch (error) {
        console.error('Error fetching source code data:', error);
        // Set empty arrays on error
        setEntityChurn([]);
        setCoupling([]);
        setEntityEffort([]);
        setCodeChurn([]);
        setEntityOwnership([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  // if (loading) {
  //   return <div className="text-center p-8">Loading source code metrics...</div>;
  // }

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Entity Churn (Top 20)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ensureArray(entityChurn)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="entity" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="added" stackId="a" fill="#82ca9d" name="Added" />
                <Bar dataKey="deleted" stackId="a" fill="#ff6b6b" name="Deleted" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entity Effort (Top 20)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ensureArray(entityEffort)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="entity" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total-revs" fill="#8884d8" name="Total Revisions" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Code Churn Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={ensureArray(codeChurn)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#8884d8" name="Lines Changed" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entity Ownership</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ensureArray(entityOwnership).slice(0, 15)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="entity" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="added" stackId="a" fill="#82ca9d" name="Added" />
                <Bar dataKey="deleted" stackId="a" fill="#ff6b6b" name="Deleted" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

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
                {Array.isArray(coupling) && coupling.map((item, idx) => (
                  <tr key={`coupling-${item.entity}-${item.coupled}-${idx}`} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-mono text-xs">{item.entity}</td>
                    <td className="p-2 font-mono text-xs">{item.coupled}</td>
                    <td className="p-2 text-right">
                      <span className="px-2 py-1 rounded bg-blue-100 text-blue-800">
                        {item.degree}
                      </span>
                    </td>
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
