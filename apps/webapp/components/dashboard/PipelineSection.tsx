import { pipelineAPI } from '@/lib/api';
import { DashboardFilters } from '@/components/filters/DashboardFilters';
import { buildPipelineApiParams } from '@/lib/utils/apiParams';
import PipelineRunsDurationCard from '../charts/pipeline/PipelineRunsDurationCard';
import JobsAverageTimeCard from '../charts/pipeline/JobsAverageTimeCard';
import JobsByStatusCard from '../charts/pipeline/JobsByStatusCard';
import {
  JobsAverageTimeData,
  JobsAverageTimeResponseItem,
  JobByStatusData,
  JobByStatusResponseItem,
  RunsDurationData,
  RunsDurationResponseItem,
} from '../charts/pipeline/types';

type ResultWrapper<T> = {
  result: T;
};

function unwrapResult<T>(data: T | ResultWrapper<T>): T {
  if (typeof data === 'object' && data !== null && 'result' in data) {
    return data.result;
  }
  return data;
}

export default async function PipelineSection({ filters }: { filters: DashboardFilters }) {
  let jobsByStatus: JobByStatusData[] = [];
  let runsDuration: RunsDurationData[] = [];
  let jobsAvgTime: JobsAverageTimeData[] = [];

  try {
    const apiParams = buildPipelineApiParams(filters);
    const [jobs, duration, avgTime] = await Promise.all([
      pipelineAPI.jobsByStatus(apiParams),
      pipelineAPI.runsDuration(apiParams),
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
    jobsAvgTime = avgTimeData;
  } catch (error) {
    console.error('Error fetching pipeline data:', error);
    // Set empty arrays on error to prevent map errors
    jobsByStatus = [];
    runsDuration = [];
    jobsAvgTime = [];
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PipelineRunsDurationCard data={runsDuration} />
        <JobsAverageTimeCard data={jobsAvgTime} />
      </div>

      <JobsByStatusCard data={jobsByStatus} />
    </div>
  );
}
