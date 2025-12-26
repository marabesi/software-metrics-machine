from collections import Counter
from typing import Dict, TypedDict, Optional
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)
from software_metrics_machine.core.pipelines.pipelines_types import (
    PipelineRun,
    PipelineFilters,
)


class PipelineRunDetails(TypedDict):
    count: int
    path: str


class PipelineRunSummaryStructure(TypedDict):
    total_runs: int
    completed: int
    in_progress: int
    queued: int
    unique_workflows: int
    runs_by_workflow: Dict[str, PipelineRunDetails]
    first_run: PipelineRun | None
    last_run: PipelineRun | None
    most_failed: str


class PipelineRunSummary:
    def __init__(self, repository: PipelinesRepository):
        self.repository: PipelinesRepository = repository

    def compute_summary(
        self,
        start_date: str | None = None,
        end_date: str | None = None,
        raw_filters: Optional[str] = None,
    ) -> PipelineRunSummaryStructure:
        filters = PipelineFilters(
            **{
                "start_date": start_date,
                "end_date": end_date,
                "raw_filters": raw_filters,
            }
        )
        self.runs = self.repository.runs(filters)
        return self.__create_summary_structure(filters)

    def __create_summary_structure(self, filters) -> PipelineRunSummaryStructure:
        summary: PipelineRunSummaryStructure = {
            "total_runs": len(self.runs),
            "completed": 0,
            "in_progress": 0,
            "queued": 0,
            "unique_workflows": 0,
            "runs_by_workflow": {},
            "first_run": None,
            "last_run": None,
            "most_failed": "N/A",
        }

        if summary["total_runs"] == 0:
            return summary

        # assume runs are in chronological order; take first and last
        summary["first_run"] = self.runs[0]
        summary["last_run"] = self.runs[-1]

        completed = [r for r in self.runs if r.status == "completed"]

        summary["completed"] = len(completed)
        summary["in_progress"] = len(
            [r for r in self.runs if r.status == "in_progress"]
        )
        summary["queued"] = len([r for r in self.runs if r.status == "queued"])

        workflows = {r.name for r in self.runs if r.name}
        summary["unique_workflows"] = len(workflows)

        name_counts: Counter[str] = Counter()
        name_paths: dict = {}
        for r in self.runs:
            name = r.name
            if not name:
                continue
            name_counts[name] += 1
            # prefer explicit 'path' field if present, else try 'workflow_path' or 'file'
            if name not in name_paths:
                name_paths[name] = r.path

        summary["runs_by_workflow"] = {
            k: {"count": v, "path": name_paths.get(k) or ""}
            for k, v in name_counts.items()
        }

        most_failed_runs = self.repository.get_pipeline_fails_the_most(filters)
        if len(most_failed_runs) > 0:
            most_failed = most_failed_runs[0]["pipeline_name"]
            count = most_failed_runs[0]["failed"]
            summary["most_failed"] = f"{most_failed} ({count})"

        return summary
