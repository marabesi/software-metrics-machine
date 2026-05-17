import Card from '@mui/material/Card';
import { DashboardFilters, defaultFilters, parseDashboardFilters } from "@/components/filters/DashboardFilters";
import { CardContent, CardHeader } from '@mui/material';
import { sourceCodeAPI, pipelineAPI, pullRequestAPI, ApiParams } from '@/server/api';
import { DeploymentFrequency } from '@/components/charts/DeploymentFrequency';
import { DeploymentFrequencyPoint, DeploymentFrequencyResponseItem, PairingIndex, PipelineSummary, PullRequestSummary, ResultWrapper } from './insights-types';

function unwrapResult<T>(data: T | ResultWrapper<T>): T {
  if (typeof data === 'object' && data !== null && 'result' in data) {
    return data.result;
  }
  return data;
}

function buildApiParams(filters: DashboardFilters): ApiParams {
  return {
    start_date: filters.startDate,
    end_date: filters.endDate,
    authors: filters.authorSelect && filters.authorSelect.length > 0 ? filters.authorSelect.join(',') : undefined,
  };
}

function buildPipelineApiParams(filters: DashboardFilters): ApiParams {
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

export default async function InsightsSection({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseDashboardFilters(await searchParams ?? {}, defaultFilters);

  let pairingIndex: PairingIndex | null = null;
  let pipelineSummary: PipelineSummary | null = null;
  let prSummary: PullRequestSummary | null = null;
  let deploymentFrequency: DeploymentFrequencyPoint[] = [];

  try {
    const apiParams = buildApiParams(filters);
    const pipelineParams = buildPipelineApiParams(filters);
    const [pairing, pipeline, pr, deployment] = await Promise.all([
      sourceCodeAPI.pairingIndex(apiParams),
      pipelineAPI.summary(apiParams),
      pullRequestAPI.summary(apiParams),
      pipelineAPI.deploymentFrequency(pipelineParams),
    ]);
    const prData = unwrapResult(pr as PullRequestSummary | ResultWrapper<PullRequestSummary>);
    const pairingData = unwrapResult(pairing as PairingIndex | ResultWrapper<PairingIndex>);
    const pipelineData = unwrapResult(pipeline as PipelineSummary | ResultWrapper<PipelineSummary>);
    const deploymentResult = unwrapResult(
      deployment as DeploymentFrequencyResponseItem[] | ResultWrapper<DeploymentFrequencyResponseItem[]>
    );
    const deploymentData = Array.isArray(deploymentResult) ? deploymentResult
      .map((d: DeploymentFrequencyResponseItem): DeploymentFrequencyPoint => {
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
      .reduce((acc: DeploymentFrequencyPoint[], item: DeploymentFrequencyPoint) => {
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

    pairingIndex = pairingData || null;
    pipelineSummary = pipelineData || null;
    prSummary = prData;
    deploymentFrequency = deploymentData
  } catch (error) {
    console.error('Error fetching insights:', error);
    pairingIndex = null;
    pipelineSummary = null;
    prSummary = null;
    deploymentFrequency = [];
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
          <DeploymentFrequency deploymentFrequency={deploymentFrequency} monthTransitionIndices={monthTransitionIndices} />
        </CardContent>
      </Card>
    </div>
  );
}
