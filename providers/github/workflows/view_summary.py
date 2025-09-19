import argparse
from collections import Counter
from typing import List
from providers.github.workflows.repository_workflows import LoadWorkflows
from infrastructure.date_and_time import datetime_to_local


def summarize_runs(runs: List[dict]) -> dict:
    summary = {}
    total = len(runs)
    summary["total_runs"] = total
    if total == 0:
        summary.update(
            {
                "first_run": None,
                "last_run": None,
                "completed": 0,
                "in_progress": 0,
                "queued": 0,
                "unique_workflows": 0,
            }
        )
        return summary

    # assume runs are in chronological order; take first and last
    first = runs[0]
    last = runs[-1]
    summary["first_run"] = first
    summary["last_run"] = last

    completed = [r for r in runs if r.get("status") == "completed"]

    summary["completed"] = len(completed)
    summary["in_progress"] = len([r for r in runs if r.get("status") == "in_progress"])
    summary["queued"] = len([r for r in runs if r.get("status") == "queued"])

    workflows = {r.get("name") for r in runs if r.get("name")}
    summary["unique_workflows"] = len(workflows)

    # aggregate counts by workflow name and capture a representative path (if available)
    name_counts = Counter()
    name_paths = {}
    for r in runs:
        name = r.get("name") or "<unnamed>"
        name_counts[name] += 1
        # prefer explicit 'path' field if present, else try 'workflow_path' or 'file'
        if name not in name_paths:
            path = r.get("path") or r.get("workflow_path") or r.get("file") or None
            if path:
                name_paths[name] = path

    summary["runs_by_workflow"] = {
        k: {"count": v, "path": name_paths.get(k)} for k, v in name_counts.items()
    }

    return summary


def print_run(first, last) -> None:
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


def print_summary(summary: dict, max_workflows: int = 10) -> None:
    if summary.get("total_runs", 0) == 0:
        print("No workflow runs available.")
        return

    print("")
    print("Workflow runs summary:")
    print(f"  Total runs: {summary['total_runs']}")
    print(f"  Completed runs: {summary['completed']}")
    print(f"  In-progress runs: {summary['in_progress']}")
    print(f"  Queued runs: {summary['queued']}")

    # print runs aggregated by workflow name (sorted by count desc)
    runs_by_wf = summary.get("runs_by_workflow", {})
    if runs_by_wf:
        print("")
        print("Runs by workflow name:")
        # runs_by_wf now maps name -> {'count': n, 'path': p}
        sorted_items = sorted(
            runs_by_wf.items(), key=lambda x: x[1].get("count", 0), reverse=True
        )
        for name, info in sorted_items[:max_workflows]:
            cnt = info.get("count", 0)
            path = info.get("path") or "<no path>"
            print(f"  {cnt:4d}  {name}  ({path})")

    # print first/last with formatted dates
    first = summary["first_run"]
    last = summary["last_run"]

    print_run(first, last)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Print a quick summary of workflow runs"
    )
    parser.add_argument(
        "--max-workflows",
        type=int,
        default=10,
        help="Maximum number of workflows to list in the summary (default: 10)",
    )
    args = parser.parse_args()

    lw = LoadWorkflows()
    runs = lw.runs()
    summary = summarize_runs(runs)
    print_summary(summary, max_workflows=args.max_workflows)
