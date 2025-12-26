from typing import Any, Dict, TypedDict

from software_metrics_machine.core.pipelines.aggregates.jobs_summary import JobsSummary
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)
from software_metrics_machine.core.infrastructure.date_and_time import datetime_to_local
from software_metrics_machine.core.pipelines.pipelines_types import PipelineJob


class JobTimeDetails(TypedDict, total=False):
    created_at: str | None
    started_at: str | None
    completed_at: str | None


class JobsSummaryResult(TypedDict, total=False):
    total_jobs: int
    conclusions: Dict[str, int]
    unique_jobs: int
    jobs_by_name: Dict[str, Dict[str, Any]]
    first_job: JobTimeDetails
    last_job: JobTimeDetails


class ViewJobsSummary:
    def __init__(self, repository: PipelinesRepository):
        self.repository = repository

    def print_summary(
        self,
        max_jobs: int = 10,
        start_date: str | None = None,
        end_date: str | None = None,
        pipeline: str | None = None,
    ) -> JobsSummaryResult:
        self.jobs = self.repository.jobs(
            {"start_date": start_date, "end_date": end_date, "pipeline": pipeline}
        )

        self.jobs_summary = JobsSummary(repository=self.repository)
        summary = self.jobs_summary.summarize_jobs(self.jobs)

        if summary.get("total_jobs", 0) == 0:
            return {"total_jobs": 0}

        result: JobsSummaryResult = {}
        result["total_jobs"] = summary.get("total_jobs", 0)

        concls = summary.get("conclusions", {})
        if concls:
            result["conclusions"] = concls

        result["unique_jobs"] = summary.get("unique_jobs", 0)

        jobs_by_name = summary.get("jobs_by_name")
        if jobs_by_name:
            # include top max_jobs entries
            sorted_items = sorted(
                jobs_by_name.items(), key=lambda x: x[1].get("count", 0), reverse=True  # type: ignore[arg-type,return-value]
            )
            result["jobs_by_name"] = {k: v for k, v in sorted_items[:max_jobs]}

        # first/last with formatted dates
        first: PipelineJob | None = summary.get("first_job")
        last: PipelineJob | None = summary.get("last_job")

        result["first_job"] = self.__build_job_times(first)
        result["last_job"] = self.__build_job_times(last)

        return result

    def __build_job_times(self, job: PipelineJob | None) -> JobTimeDetails:
        if job is None:
            return {"created_at": None, "started_at": None, "completed_at": None}

        created_at = job.created_at
        started_at = job.started_at or ""
        ended_at = job.completed_at or ""

        return {
            "created_at": datetime_to_local(created_at),
            "started_at": datetime_to_local(started_at),
            "completed_at": datetime_to_local(ended_at),
        }
