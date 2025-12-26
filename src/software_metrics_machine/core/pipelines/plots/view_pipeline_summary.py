from typing import Optional, Dict, TypedDict
from software_metrics_machine.core.infrastructure.date_and_time import datetime_to_local
from software_metrics_machine.core.pipelines.aggregates.pipeline_summary import (
    PipelineRunSummary,
)
from software_metrics_machine.core.pipelines.pipelines_types import PipelineRun
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)


class WorkflowRunDetails(TypedDict):
    count: int
    path: str


class WorkflowRunSummaryStructure(TypedDict):
    total_runs: int
    completed: int
    in_progress: int
    queued: int
    unique_workflows: int
    runs_by_workflow: Dict[str, WorkflowRunDetails]
    first_run: Dict
    last_run: Dict
    most_failed: Optional[str]


class WorkflowRunSummary:
    def __init__(self, repository: PipelinesRepository):
        self.summary = PipelineRunSummary(repository=repository)

    def print_summary(
        self,
        max_workflows: int = 10,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        output_format: Optional[str] = None,
        raw_filters: Optional[str] = None,
    ) -> WorkflowRunSummaryStructure:
        summary = self.summary.compute_summary(
            start_date=start_date, end_date=end_date, raw_filters=raw_filters
        )

        if output_format and output_format not in ["text", "json"]:
            raise ValueError("Invalid output_format. Must be 'text' or 'json'.")

        # if no runs, return an empty structured summary
        if summary.get("total_runs", 0) == 0:
            return {
                "total_runs": 0,
                "completed": 0,
                "in_progress": 0,
                "queued": 0,
                "unique_workflows": 0,
                "runs_by_workflow": {},
                "first_run": {},
                "last_run": {},
                "most_failed": None,
            }

        # Build structured summary, formatting dates for first/last runs
        runs_by_wf = summary.get("runs_by_workflow", {})

        result: WorkflowRunSummaryStructure = {
            "total_runs": summary.get("total_runs", 0),
            "completed": summary.get("completed", 0),
            "in_progress": summary.get("in_progress", 0),
            "queued": summary.get("queued", 0),
            "unique_workflows": summary.get("unique_workflows", 0),
            "runs_by_workflow": runs_by_wf,
            "first_run": self.__build_run_times(summary.get("first_run")),
            "last_run": self.__build_run_times(summary.get("last_run")),
            "most_failed": None,
        }

        # include 'most_failed' if present
        if "most_failed" in summary:
            result["most_failed"] = summary["most_failed"]  # type: ignore[index]

        return result

    def __build_run_times(self, run: PipelineRun | None) -> Dict:
        if not run:
            return {}

        created_at = run.created_at
        started_at = run.run_started_at
        updated_at = run.updated_at

        return {
            "created_at": datetime_to_local(created_at) if created_at else None,
            "run_started_at": datetime_to_local(started_at) if started_at else None,
            "updated_at": datetime_to_local(updated_at) if updated_at else None,
        }
