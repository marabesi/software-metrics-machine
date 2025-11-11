from typing import Optional, Dict, TypedDict
from software_metrics_machine.core.infrastructure.date_and_time import datetime_to_local
from software_metrics_machine.core.pipelines.aggregates.pipeline_summary import (
    PipelineRunSummary,
)
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


class WorkflowRunSummary:
    def __init__(self, repository: PipelinesRepository):
        self.summary = PipelineRunSummary(repository=repository)

    def print_summary(
        self,
        max_workflows: int = 10,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        output_format: Optional[str] = None,
    ):
        """
        Print or return the summary of workflow runs.

        :param max_workflows: Maximum number of workflows to display.
        :param output_format: Specifies the output format. Accepts 'text' or 'json'.
                              If not provided, returns the summary structure.
        """
        summary = self.summary.compute_summary(start_date=start_date, end_date=end_date)

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
                print(f"  Most failed run: {summary['most_failed']}")

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
        if (first.get("created_at") is None) or (
            last.get("created_at") is None or first.get("updated_at") is None
        ):
            print("No valid run data available to display first and last runs.")
            return

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
