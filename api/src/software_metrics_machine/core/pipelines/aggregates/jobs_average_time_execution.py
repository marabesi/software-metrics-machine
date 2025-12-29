import dataclasses
from collections import defaultdict
from datetime import datetime
from typing import Optional, List, Tuple

from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)
from software_metrics_machine.core.pipelines.pipelines_types import (
    PipelineFilters,
    PipelineJob,
    PipelineRun,
)


@dataclasses.dataclass
class JobsAverageTimeExecutionResult:
    runs: List[PipelineRun]
    jobs: List[PipelineJob]
    averages: List[Tuple[str, float]]
    sums: List[Tuple[str, float]]
    counts: dict[str, float]


class JobsByAverageTimeExecution:

    def __init__(self, repository: PipelinesRepository):
        self.repository = repository

    def main(
        self,
        workflow_path: Optional[str] = None,
        raw_filters: Optional[str] = None,
        top: int = 20,
        exclude_jobs: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        job_name: Optional[str] = None,
        pipeline_raw_filters: Optional[str] = None,
        metric: str = "avg",
    ) -> JobsAverageTimeExecutionResult:
        filters: dict = {
            "start_date": start_date,
            "end_date": end_date,
            "raw_filters": pipeline_raw_filters,
        }

        runs = self.repository.runs(filters=PipelineFilters(**filters))

        job_filters = {**filters, "name": job_name, "exclude_jobs": exclude_jobs}

        jobs = self.repository.jobs(filters=job_filters)
        # aggregate durations by job name
        sums: dict[str, float] = defaultdict(float)
        counts: dict[str, float] = defaultdict(int)
        for job in jobs:
            name = job.name
            started = job.started_at
            completed = job.completed_at
            if not started or not completed:
                continue
            dt_start = datetime.fromisoformat(started.replace("Z", "+00:00"))
            dt_end = datetime.fromisoformat(completed.replace("Z", "+00:00"))
            secs = (dt_end - dt_start).total_seconds()
            if secs < 0:
                # ignore negative durations
                continue
            sums[name] += secs
            counts[name] += 1

        averages: List[Tuple[str, float]] = [
            (name, (sums[name] / counts[name]) / 60.0) for name in counts.keys()
        ]  # minutes

        sums_list: List[Tuple[str, float]] = [
            (name, sums[name] / 60.0) for name in counts.keys()
        ]
        # sort by average descending (longest first)
        averages.sort(key=lambda x: x[1], reverse=True)
        averages = averages[:top]

        return JobsAverageTimeExecutionResult(
            runs=runs, jobs=jobs, averages=averages, counts=counts, sums=sums_list
        )
