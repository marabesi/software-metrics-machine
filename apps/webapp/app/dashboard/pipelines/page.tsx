import { pipelineAPI } from '@/server/api';
import { buildPipelineApiParams } from '@/server/utils/apiParams';
import {
  JobsAverageTimeData,
  JobsAverageTimeResponseItem,
  JobByStatusData,
  JobByStatusResponseItem,
  JobsDurationByWorkflowItem,
  RunsByDayData,
  RunsByResponseItem,
  RunsDurationData,
  RunsDurationResponseItem,
} from '@/components/charts/pipeline/types';
import { defaultFilters, parseDashboardFilters } from '@/components/filters/DashboardFilters';
import PipelineRunsDurationCard from '@/components/charts/pipeline/PipelineRunsDurationCard';
import JobsAverageTimeCard from '@/components/charts/pipeline/JobsAverageTimeCard';
import JobsByStatusCard from '@/components/charts/pipeline/JobsByStatusCard';

type ResultWrapper<T> = {
  result: T;
};

function unwrapResult<T>(data: T | ResultWrapper<T>): T {
  if (typeof data === 'object' && data !== null && 'result' in data) {
    return data.result;
  }
  return data;
}

export default async function PipelinesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseDashboardFilters(await searchParams ?? {}, defaultFilters);
  let jobsByStatus: JobByStatusData[] = [];
  let runsDurationByAggregation: Record<'avg' | 'min' | 'max', RunsDurationData[]> = {
    avg: [],
    min: [],
    max: [],
  };
  let runsByDay: RunsByDayData[] = [];
  let jobsAvgTime: JobsAverageTimeData[] = [];
  let jobsDurationByWorkflow: JobsDurationByWorkflowItem[] = [];

  try {
    const apiParams = buildPipelineApiParams(filters);
    const [jobs, duration, runsBy, avgTime, jobsDurationRaw] = await Promise.all([
      pipelineAPI.jobsByStatus(apiParams),
      pipelineAPI.runsDuration(apiParams),
      pipelineAPI.runsBy({ ...apiParams, aggregate_by: 'day' }),
      pipelineAPI.jobsAverageTime(apiParams),
      pipelineAPI.jobsDurationByWorkflow(apiParams),
    ]);

    // Handle jobsByStatus - Status and Count fields
    const jobsResult = unwrapResult(jobs as JobByStatusResponseItem[] | ResultWrapper<JobByStatusResponseItem[]>);
    const jobsData = Array.isArray(jobsResult) ? jobsResult.map((j: JobByStatusResponseItem): JobByStatusData => ({
      status: (j.Status || 'unknown').toLowerCase(),
      count: j.Count || 0,
    })) : [];

    // Handle runsDuration - read all API-computed aggregations from a single response
    const durationResult = unwrapResult(
      duration as RunsDurationResponseItem[] | ResultWrapper<RunsDurationResponseItem[]>
    );
    const durationData = Array.isArray(durationResult)
      ? durationResult.map((d: RunsDurationResponseItem): RunsDurationData => ({
          workflow: d.workflow || d.name || 'Unknown',
          avg_duration: d.avg_duration ?? d.value ?? 0,
          min_duration: d.min_duration ?? 0,
          max_duration: d.max_duration ?? 0,
          total_runs: d.total_runs ?? 0,
          name: d.name,
          value: d.value,
        }))
      : [];

    const runsByResult = unwrapResult(
      runsBy as RunsByResponseItem[] | ResultWrapper<RunsByResponseItem[]>
    );
    const runsByDayData = Array.isArray(runsByResult)
      ? runsByResult.reduce((acc: Map<string, number>, item: RunsByResponseItem) => {
          const day = item.period || '';
          if (!day) {
            return acc;
          }

          acc.set(day, (acc.get(day) || 0) + Number(item.runs || 0));
          return acc;
        }, new Map<string, number>())
      : new Map<string, number>();

    // Handle jobsAverageTime - unwrap if needed and transform
    let avgTimeData: JobsAverageTimeData[] = [];
    const avgTimeResult = unwrapResult(
      avgTime as JobsAverageTimeResponseItem[] | ResultWrapper<JobsAverageTimeResponseItem[]>
    );
    if (Array.isArray(avgTimeResult)) {
      avgTimeData = avgTimeResult.map((a: JobsAverageTimeResponseItem): JobsAverageTimeData => ({
        job_name: a.job_name || 'Unknown',
        avg_time: a.avg_time || 0
      }));
    }

    jobsByStatus = jobsData;
    runsDurationByAggregation = {
      avg: durationData,
      min: durationData,
      max: durationData,
    };
    runsByDay = Array.from(runsByDayData.entries())
      .map(([day, runs]) => ({ day, runs }))
      .sort((a, b) => a.day.localeCompare(b.day));
    jobsAvgTime = avgTimeData;
    jobsDurationByWorkflow = Array.isArray(jobsDurationRaw) ? jobsDurationRaw : [];
  } catch (error) {
    console.error('Error fetching pipeline data:', error);
    // Set empty arrays on error to prevent map errors
    jobsByStatus = [];
    runsDurationByAggregation = { avg: [], min: [], max: [] };
    runsByDay = [];
    jobsAvgTime = [];
    jobsDurationByWorkflow = [];
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <PipelineRunsDurationCard
          dataByAggregation={runsDurationByAggregation}
          runsByDay={runsByDay}
          jobsDurationByWorkflow={jobsDurationByWorkflow}
        />
        <JobsAverageTimeCard data={jobsAvgTime} />
      </div>

      <JobsByStatusCard data={jobsByStatus} />
    </div>
  );
}
