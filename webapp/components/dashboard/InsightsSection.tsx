'use client';

import { useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import {CardContent, CardHeader} from '@mui/material';
import { sourceCodeAPI, pipelineAPI, pullRequestAPI, ApiParams } from '@/lib/api';
import { useFilters } from '@/components/filters/FiltersContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ensureArray } from '@/lib/utils/chartData';

function buildApiParams(filters: any): ApiParams {
  return {
    start_date: filters.startDate,
    end_date: filters.endDate,
    authors: filters.authorSelect && filters.authorSelect.length > 0 ? filters.authorSelect.join(',') : undefined,
  };
}

function buildPipelineApiParams(filters: any): ApiParams {
  return {
    start_date: filters.startDate,
    end_date: filters.endDate,
    workflow_path: filters.workflowSelector,
    status: filters.workflowStatus?.length ? filters.workflowStatus.join(',') : undefined,
    conclusion: filters.workflowConclusions?.length ? filters.workflowConclusions.join(',') : undefined,
    job_name: filters.jobSelector?.length ? filters.jobSelector.join(',') : undefined,
    branch: filters.branch?.length ? filters.branch.join(',') : undefined,
    event: filters.event?.length ? filters.event.join(',') : undefined,
    metric: filters.aggregateMetric,
  };
}

export default function InsightsSection() {
  const { filters } = useFilters();
  const [pairingIndex, setPairingIndex] = useState<any>(null);
  const [pipelineSummary, setPipelineSummary] = useState<any>(null);
  const [prSummary, setPrSummary] = useState<any>(null);
  const [deploymentFrequency, setDeploymentFrequency] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const apiParams = buildApiParams(filters);
        const pipelineParams = buildPipelineApiParams(filters);
        const [pairing, pipeline, pr, deployment] = await Promise.all([
          sourceCodeAPI.pairingIndex(apiParams),
          pipelineAPI.summary(apiParams),
          pullRequestAPI.summary(apiParams),
          pipelineAPI.deploymentFrequency(pipelineParams),
        ]);
        // Handle both direct object responses and wrapped responses
        const prData = pr && typeof pr === 'object' && 'result' in pr ? pr.result : pr;
        const pairingData = pairing && typeof pairing === 'object' && 'result' in pairing ? pairing.result : pairing;
        const pipelineData = pipeline && typeof pipeline === 'object' && 'result' in pipeline ? pipeline.result : pipeline;
        const deploymentData = Array.isArray(deployment) ? deployment
          .map((d: any) => {
            const dateStr = d.days || 'Unknown';
            // Extract month from date (YYYY-MM-DD -> YYYY-MM)
            const month = dateStr !== 'Unknown' ? dateStr.substring(0, 7) : 'Unknown';
            return {
              date: dateStr,
              month: month,
              day_count: d.daily_counts || 0,
              week_count: d.weekly_counts || 0,
              month_count: d.monthly_counts || 0,
            };
          })
          // Deduplicate by date (in case multiple records for same day) and sum counts
          .reduce((acc: any[], item: any) => {
            const existing = acc.find(a => a.date === item.date);
            if (existing) {
              existing.day_count = Math.max(existing.day_count, item.day_count);
              existing.week_count = Math.max(existing.week_count, item.week_count);
              existing.month_count = Math.max(existing.month_count, item.month_count);
            } else {
              acc.push(item);
            }
            return acc;
          }, [])
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        : [];
        
        setPairingIndex(pairingData || null);
        setPipelineSummary(pipelineData || null);
        setPrSummary(prData);
        setDeploymentFrequency(deploymentData);
      } catch (error) {
        console.error('Error fetching insights:', error);
        setPairingIndex(null);
        setPipelineSummary(null);
        setPrSummary(null);
        setDeploymentFrequency([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  if (loading) {
    return <div className="text-center p-8">Loading insights...</div>;
  }

  // Get month transition indices for reference lines
  const monthTransitionIndices = deploymentFrequency
    .map((d, idx) => ({
      date: d.date,
      month: d.month,
      idx,
    }))
    .filter((d, idx) => idx === 0 || d.month !== deploymentFrequency[idx - 1]?.month)
    .map(d => d.date);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader title="Pairing Index">
            <CardContent>Team collaboration metric</CardContent>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {pairingIndex?.pairing_index_percentage?.toFixed(2) || 0}%
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {pairingIndex?.paired_commits || 0} of {pairingIndex?.total_analyzed_commits || 0} commits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Pipeline Runs">
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{pipelineSummary?.total_runs || 0}</div>
            <div className="grid grid-cols-3 gap-2 mt-4 text-sm">
              <div>
                <div className="text-green-600 font-semibold">✓ Success</div>
              </div>
              <div>
                <div className="text-yellow-600 font-semibold">{pipelineSummary?.in_progress || 0} In Progress</div>
              </div>
              <div>
                <div className="text-blue-600 font-semibold">{pipelineSummary?.queued || 0} Queued</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Pull Requests">
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{prSummary?.total_prs || prSummary?.total || 0}</div>
            <div className="grid grid-cols-3 gap-2 mt-4 text-sm">
              <div>
                <div className="text-green-600 font-semibold">{prSummary?.merged_prs || prSummary?.merged || 0} Merged</div>
              </div>
              <div>
                <div className="text-gray-600 font-semibold">{prSummary?.closed_prs || prSummary?.closed || 0} Closed</div>
              </div>
              <div>
                <div className="text-blue-600 font-semibold">{prSummary?.open_prs || prSummary?.open || 0} Open</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader title="Deployment Frequency" />
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={ensureArray(deploymentFrequency)}>
              <CartesianGrid strokeDasharray="3 3" />
              {monthTransitionIndices.map((date) => (
                <ReferenceLine key={date} x={date} stroke="#000" strokeWidth={2} />
              ))}
              <XAxis dataKey="date" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="day_count" stroke="#8884d8" name="Daily" dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={ensureArray(deploymentFrequency)}>
              <CartesianGrid strokeDasharray="3 3" />
              {monthTransitionIndices.map((date) => (
                <ReferenceLine key={date} x={date} stroke="#000" strokeWidth={2} />
              ))}
              <XAxis dataKey="date" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="week_count" stroke="#82ca9d" name="Weekly" dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="month_count" stroke="#ffc658" name="Monthly" dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
