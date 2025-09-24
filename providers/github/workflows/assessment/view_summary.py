from collections import Counter
from typing import Dict, TypedDict
from infrastructure.date_and_time import datetime_to_local
from providers.github.workflows.repository_workflows import LoadWorkflows


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


class WorkflowRunSummary:
    def __init__(self, repository: LoadWorkflows):
        self.runs = repository.runs()

    def compute_summary(self) -> WorkflowRunSummaryStructure:
        """
        Compute the summary of workflow runs.

        :return: A dictionary containing the summary structure.
        """
        return self.__create_summary_structure()

    def print_summary(self, max_workflows: int = 10, output_format: str = None):
        """
        Print or return the summary of workflow runs.

        :param max_workflows: Maximum number of workflows to display.
        :param output_format: Specifies the output format. Accepts 'text' or 'json'.
                              If not provided, returns the summary structure.
        """
        summary = self.compute_summary()

        if output_format:
            if output_format not in ["text", "json"]:
                raise ValueError("Invalid output_format. Must be 'text' or 'json'.")

            if output_format == "json":
                import json

                print(json.dumps(summary, indent=4))
                return

            if output_format == "text":
                if summary["total_runs"] == 0:
                    print("No workflow runs available.")
                    return

                print("")
                print("Workflow runs summary:")
                print(f"  Total runs: {summary['total_runs']}")
                print(f"  Completed runs: {summary['completed']}")
                print(f"  In-progress runs: {summary['in_progress']}")
                print(f"  Queued runs: {summary['queued']}")

                # print runs aggregated by workflow name (sorted by count desc)
                runs_by_wf = summary["runs_by_workflow"]
                if runs_by_wf:
                    print("")
                    print("Runs by workflow name:")
                    sorted_items = sorted(
                        runs_by_wf.items(), key=lambda x: x[1]["count"], reverse=True
                    )
                    for name, info in sorted_items[:max_workflows]:
                        cnt = info["count"]
                        path = info["path"]
                        print(f"  {cnt:4d}  {name}  ({path})")

                # print first/last with formatted dates
                first = summary["first_run"]
                last = summary["last_run"]

                self.__print_run(first, last)
                return

        return summary

    def __print_run(self, first: dict, last: dict) -> None:
        print("")
        print("First run:")
        created_at = first.get("created_at")
        started_at = first.get("run_started_at")
        ended_at = first.get("updated_at")
        print(f"  Created run at: {datetime_to_local(created_at)}")
        print(f"  Started run at: {datetime_to_local(started_at)}")
        print(f"  Updated run at: {datetime_to_local(ended_at)} (Ended at)")

        print("")
        print("Last run:")
        created_at = last.get("created_at")
        started_at = last.get("run_started_at")
        ended_at = last.get("updated_at")
        print(f"  Created run at: {datetime_to_local(created_at)}")
        print(f"  Started run at: {datetime_to_local(started_at)}")
        print(f"  Updated run at: {datetime_to_local(ended_at)} (Ended at)")

    def __create_summary_structure(self) -> WorkflowRunSummaryStructure:
        summary: WorkflowRunSummaryStructure = {
            "total_runs": len(self.runs),
            "completed": 0,
            "in_progress": 0,
            "queued": 0,
            "unique_workflows": 0,
            "runs_by_workflow": {},
            "first_run": None,
            "last_run": None,
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

        return summary
