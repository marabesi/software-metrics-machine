'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { sourceCodeAPI } from '@/lib/api';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';

export default function SourceCodeSection() {
  const [dateRange, setDateRange] = useState({ start_date: '', end_date: '' });
  const [entityChurn, setEntityChurn] = useState<any[]>([]);
  const [coupling, setCoupling] = useState<any[]>([]);
  const [entityEffort, setEntityEffort] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [churn, coup, effort] = await Promise.all([
          sourceCodeAPI.entityChurn({ ...dateRange, top: 20 }),
          sourceCodeAPI.coupling({ ...dateRange, top: 20 }),
          sourceCodeAPI.entityEffort({ ...dateRange, top_n: 20 }),
        ]);
        setEntityChurn(churn);
        setCoupling(coup);
        setEntityEffort(effort);
      } catch (error) {
        console.error('Error fetching source code data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  if (loading) {
    return <div className="text-center p-8">Loading source code metrics...</div>;
  }

  return (
    <div className="space-y-6">
      <DateRangePicker
        startDate={dateRange.start_date}
        endDate={dateRange.end_date}
        onChange={setDateRange}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Entity Churn (Top 20)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={entityChurn}>
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
              <BarChart data={entityEffort}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="entity" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revisions" fill="#8884d8" name="Revisions" />
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
                {coupling.map((item, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
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
