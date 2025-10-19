from collections import Counter
from typing import Dict, TypedDict
from core.pipelines.pipelines_repository import PipelinesRepository
from core.pipelines.pipelines_types import PipelineRun


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
    first_run: PipelineRun
    last_run: PipelineRun


class PipelineRunSummary:
    def __init__(self, repository: PipelinesRepository):
        self.repository = repository
        self.runs = repository.runs()

    def compute_summary(self) -> PipelineRunSummaryStructure:
        """
        Compute the summary of workflow runs.

        :return: A dictionary containing the summary structure.
        """
        return self.__create_summary_structure()

    def __create_summary_structure(self) -> PipelineRunSummaryStructure:
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

        completed = [r for r in self.runs if r.get("status") == "completed"]

        summary["completed"] = len(completed)
        summary["in_progress"] = len(
            [r for r in self.runs if r.get("status") == "in_progress"]
        )
        summary["queued"] = len([r for r in self.runs if r.get("status") == "queued"])

        workflows = {r.get("name") for r in self.runs if r.get("name")}
        summary["unique_workflows"] = len(workflows)

        # aggregate counts by workflow name and capture a representative path (if available)
        name_counts = Counter()
        name_paths = {}
        for r in self.runs:
            name = r.get("name") or "<unnamed>"
            name_counts[name] += 1
            # prefer explicit 'path' field if present, else try 'workflow_path' or 'file'
            if name not in name_paths:
                path = (
                    r.get("path")
                    or r.get("workflow_path")
                    or r.get("file")
                    or "<no path>"
                )
                name_paths[name] = path

        summary["runs_by_workflow"] = {
            k: {"count": v, "path": name_paths.get(k)} for k, v in name_counts.items()
        }

        most_failed_runs = self.repository.get_pipeline_fails_the_most()
        if len(most_failed_runs) > 0:
            summary["most_failed"] = len(most_failed_runs)

        return summary
