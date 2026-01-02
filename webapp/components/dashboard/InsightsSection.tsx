'use client';

import { useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import {CardContent, CardHeader} from '@mui/material';
import { sourceCodeAPI, pipelineAPI, pullRequestAPI } from '@/lib/api';

export default function InsightsSection() {
  const [dateRange, setDateRange] = useState({ start_date: '', end_date: '' });
  const [pairingIndex, setPairingIndex] = useState<any>(null);
  const [pipelineSummary, setPipelineSummary] = useState<any>(null);
  const [prSummary, setPrSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [pairing, pipeline, pr] = await Promise.all([
          sourceCodeAPI.pairingIndex(dateRange),
          pipelineAPI.summary(dateRange),
          pullRequestAPI.summary(dateRange),
        ]);
        setPairingIndex(pairing);
        setPipelineSummary(pipeline);
        setPrSummary(pr);
      } catch (error) {
        console.error('Error fetching insights:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

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
          <CardHeader>
            {/*<CardTitle>Pipeline Runs</CardTitle>*/}
            {/*<CardDescription>CI/CD activity</CardDescription>*/}
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
          <CardHeader>
            {/*<CardTitle>Pull Requests</CardTitle>*/}
            {/*<CardDescription>Code review metrics</CardDescription>*/}
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{prSummary?.total || 0}</div>
            <div className="grid grid-cols-3 gap-2 mt-4 text-sm">
              <div>
                <div className="text-green-600 font-semibold">{prSummary?.merged || 0} Merged</div>
              </div>
              <div>
                <div className="text-gray-600 font-semibold">{prSummary?.closed || 0} Closed</div>
              </div>
              <div>
                <div className="text-blue-600 font-semibold">{prSummary?.open || 0} Open</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
