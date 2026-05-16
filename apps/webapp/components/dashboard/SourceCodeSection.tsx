'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { sourceCodeAPI } from '@/lib/api';
import { useFilters } from '@/components/filters/FiltersContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { buildSourceCodeApiParams } from '@/lib/utils/apiParams';
import { ensureArray } from '@/lib/utils/chartData';

type ResultWrapper<T> = {
  result: T;
};

interface EntityChurnData {
  entity: string;
  added: number;
  deleted: number;
  commits: number;
}

interface CouplingData {
  entity: string;
  coupled: string;
  degree: number;
}

interface EntityEffortData {
  entity: string;
  'total-revs': number;
}

interface CodeChurnData {
  date: string;
  type: string;
  value: number;
}

interface EntityOwnershipData {
  entity: string;
  author: string;
  added: number;
  deleted: number;
}

function unwrapResult<T>(data: T | ResultWrapper<T>): T {
  if (typeof data === 'object' && data !== null && 'result' in data) {
    return data.result;
  }
  return data;
}

export default function SourceCodeSection() {
  const { filters } = useFilters();
  const [entityChurn, setEntityChurn] = useState<EntityChurnData[]>([]);
  const [coupling, setCoupling] = useState<CouplingData[]>([]);
  const [entityEffort, setEntityEffort] = useState<EntityEffortData[]>([]);
  const [codeChurn, setCodeChurn] = useState<CodeChurnData[]>([]);
  const [entityOwnership, setEntityOwnership] = useState<EntityOwnershipData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiParams = buildSourceCodeApiParams(filters);
        const [churn, coup, effort, churnOverTime, ownership] = await Promise.all([
          sourceCodeAPI.entityChurn(apiParams),
          sourceCodeAPI.coupling(apiParams),
          sourceCodeAPI.entityEffort(apiParams),
          sourceCodeAPI.codeChurn(apiParams),
          sourceCodeAPI.entityOwnership(apiParams),
        ]);
        // Handle both direct array responses and wrapped responses
        setEntityChurn(ensureArray<EntityChurnData>(unwrapResult(churn as EntityChurnData[] | ResultWrapper<EntityChurnData[]>)));
        setCoupling(ensureArray<CouplingData>(unwrapResult(coup as CouplingData[] | ResultWrapper<CouplingData[]>)));
        setEntityEffort(ensureArray<EntityEffortData>(unwrapResult(effort as EntityEffortData[] | ResultWrapper<EntityEffortData[]>)));
        setCodeChurn(ensureArray<CodeChurnData>(unwrapResult(churnOverTime as CodeChurnData[] | ResultWrapper<CodeChurnData[]>)));
        setEntityOwnership(ensureArray<EntityOwnershipData>(unwrapResult(ownership as EntityOwnershipData[] | ResultWrapper<EntityOwnershipData[]>)));
      } catch (error) {
        console.error('Error fetching source code data:', error);
        // Set empty arrays on error
        setEntityChurn([]);
        setCoupling([]);
        setEntityEffort([]);
        setCodeChurn([]);
        setEntityOwnership([]);
      }
    };

    fetchData();
  }, [filters]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Entity Churn (Top {filters.topEntries})</CardTitle>
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
            <CardTitle>Entity Effort (Top {filters.topEntries})</CardTitle>
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
