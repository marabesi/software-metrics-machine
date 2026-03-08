'use client';

import { useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import {CardContent, CardHeader} from '@mui/material';
import { sourceCodeAPI, pipelineAPI, pullRequestAPI, ApiParams } from '@/lib/api';
import { useFilters } from '@/components/filters/FiltersContext';

function buildApiParams(filters: any): ApiParams {
  return {
    start_date: filters.startDate,
    end_date: filters.endDate,
    authors: filters.authorSelect && filters.authorSelect.length > 0 ? filters.authorSelect.join(',') : undefined,
  };
}

export default function InsightsSection() {
  const { filters } = useFilters();
  const [pairingIndex, setPairingIndex] = useState<any>(null);
  const [pipelineSummary, setPipelineSummary] = useState<any>(null);
  const [prSummary, setPrSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const apiParams = buildApiParams(filters);
        const [pairing, pipeline, pr] = await Promise.all([
          sourceCodeAPI.pairingIndex(apiParams),
          pipelineAPI.summary(apiParams),
          pullRequestAPI.summary(apiParams),
        ]);
        // Handle both direct object responses and wrapped responses
        const prData = pr && typeof pr === 'object' && 'result' in pr ? pr.result : pr;
        const pairingData = pairing && typeof pairing === 'object' && 'result' in pairing ? pairing.result : pairing;
        const pipelineData = pipeline && typeof pipeline === 'object' && 'result' in pipeline ? pipeline.result : pipeline;
        setPairingIndex(pairingData || null);
        setPipelineSummary(pipelineData || null);
        setPrSummary(prData);
      } catch (error) {
        console.error('Error fetching insights:', error);
        setPairingIndex(null);
        setPipelineSummary(null);
        setPrSummary(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  if (loading) {
    return <div className="text-center p-8">Loading insights...</div>;
  }

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
    </div>
  );
}
