import { pipelineAPI } from '@/server/api';
import { buildPipelineApiParams } from '@/server/utils/apiParams';
import {
  JobsAverageTimeData,
  JobsAverageTimeResponseItem,
  JobByStatusData,
  JobByStatusResponseItem,
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
  let runsDuration: RunsDurationData[] = [];
  let runsByDay: RunsByDayData[] = [];
  let jobsAvgTime: JobsAverageTimeData[] = [];

  try {
    const apiParams = buildPipelineApiParams(filters);
    const [jobs, duration, runsBy, avgTime] = await Promise.all([
      pipelineAPI.jobsByStatus(apiParams),
      pipelineAPI.runsDuration(apiParams),
      pipelineAPI.runsBy({ ...apiParams, aggregate_by: 'day' }),
      pipelineAPI.jobsAverageTime(apiParams),
    ]);

    // Handle jobsByStatus - Status and Count fields
    const jobsResult = unwrapResult(jobs as JobByStatusResponseItem[] | ResultWrapper<JobByStatusResponseItem[]>);
    const jobsData = Array.isArray(jobsResult) ? jobsResult.map((j: JobByStatusResponseItem): JobByStatusData => ({
      status: (j.Status || 'unknown').toLowerCase(),
      count: j.Count || 0,
    })) : [];

    // Handle runsDuration - transform name/value to workflow/avg_duration
    const durationResult = unwrapResult(
      duration as RunsDurationResponseItem[] | ResultWrapper<RunsDurationResponseItem[]>
    );
    const durationData = Array.isArray(durationResult) ? durationResult.map((d: RunsDurationResponseItem): RunsDurationData => ({
      workflow: d.workflow || d.name || 'Unknown',
      avg_duration: d.avg_duration || d.value || 0,
      name: d.name,
      value: d.value
    })) : [];

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
    runsDuration = durationData;
    runsByDay = Array.from(runsByDayData.entries())
      .map(([day, runs]) => ({ day, runs }))
      .sort((a, b) => a.day.localeCompare(b.day));
    jobsAvgTime = avgTimeData;
  } catch (error) {
    console.error('Error fetching pipeline data:', error);
    // Set empty arrays on error to prevent map errors
    jobsByStatus = [];
    runsDuration = [];
    runsByDay = [];
    jobsAvgTime = [];
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <PipelineRunsDurationCard data={runsDuration} runsByDay={runsByDay} />
        <JobsAverageTimeCard data={jobsAvgTime} />
      </div>

      <JobsByStatusCard data={jobsByStatus} />
    </div>
  );
}
