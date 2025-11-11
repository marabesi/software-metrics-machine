import dataclasses
from collections import defaultdict
from datetime import datetime
from typing import Optional, List

from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)
from software_metrics_machine.core.pipelines.pipelines_types import (
    PipelineJob,
    PipelineRun,
)


@dataclasses.dataclass
class JobsAverageTimeExecutionResult:
    runs: List[PipelineRun]
    jobs: List[PipelineJob]
    averages: List[float]
    counts: dict


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
        force_all_jobs: bool = False,
        job_name: Optional[str] = None,
        pipeline_raw_filters: Optional[str] = None,
        metric: str = "avg",
    ) -> JobsAverageTimeExecutionResult:
        """Compute average job execution time (completed_at - started_at) grouped by job name and plot top-N.

        Averages are shown in minutes.
        """

        filters = {
            "start_date": start_date,
            "end_date": end_date,
            **self.repository.parse_raw_filters(pipeline_raw_filters),
        }
        print(
            f"Applying pipeline filter: {self.repository.parse_raw_filters(pipeline_raw_filters)}"
        )

        runs = self.repository.runs(filters=filters)

        job_filters = {**filters, "name": job_name}
        print(f"Applying jobs filter: {job_filters}")
        jobs = self.repository.jobs(filters=job_filters)

        if workflow_path:
            wf_low = workflow_path.lower()
            runs = [r for r in runs if (r.get("path") or "").lower().find(wf_low) != -1]

        # raw_filters = self.repository.parse_raw_filters(raw_filters)
        # # optional filter by event (e.g. push, pull_request) - accepts comma-separated or single value
        # if event_vals := raw_filters.get("event"):
        #     allowed = set(event_vals)
        #     runs = [r for r in runs if (r.get("event") or "").lower() in allowed]

        if not force_all_jobs:
            # restrict jobs to only those belonging to the selected runs
            run_ids = {r.get("id") for r in runs if r.get("id") is not None}
            jobs = [j for j in jobs if j.get("run_id") in run_ids]

        # # optional filter by target branch (accepts comma-separated values)
        # if target_vals := raw_filters.get("target_branch"):
        #     allowed = set(target_vals)

        #     def branch_matches(obj):
        #         for key in (
        #             "head_branch",
        #             "head_ref",
        #             "ref",
        #             "base_ref",
        #             "base_branch",
        #         ):
        #             val = obj.get(key) or ""
        #             if val and val.lower() in allowed:
        #                 return True
        #         return False

        #     runs = [r for r in runs if branch_matches(r)]
        #     jobs = [j for j in jobs if branch_matches(j)]

        if exclude_jobs:
            exclude = [s.strip() for s in exclude_jobs.split(",") if s.strip()]
            jobs = self.repository.filter_by_job_name(jobs, exclude)

        print(f"Found {len(runs)} workflow runs and {len(jobs)} jobs after filtering")

        # aggregate durations by job name
        sums = defaultdict(float)
        counts = defaultdict(int)
        for job in jobs:
            name = (job.get("name") or "").strip() or "<unnamed>"
            started = job.get("started_at") or job.get("created_at")
            completed = job.get("completed_at")
            if not started or not completed:
                continue
            try:
                dt_start = datetime.fromisoformat(started.replace("Z", "+00:00"))
                dt_end = datetime.fromisoformat(completed.replace("Z", "+00:00"))
            except Exception:
                continue
            secs = (dt_end - dt_start).total_seconds()
            if secs < 0:
                # ignore negative durations
                continue
            sums[name] += secs
            counts[name] += 1

        averages = [
            (name, (sums[name] / counts[name]) / 60.0) for name in counts.keys()
        ]  # minutes
        # sort by average descending (longest first)
        averages.sort(key=lambda x: x[1], reverse=True)
        averages = averages[:top]

        return JobsAverageTimeExecutionResult(
            runs=runs, jobs=jobs, averages=averages, counts=counts
        )
