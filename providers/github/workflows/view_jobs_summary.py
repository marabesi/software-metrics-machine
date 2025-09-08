import argparse
from collections import Counter
from typing import List
from workflows.repository_workflows import LoadWorkflows
from date_and_time import datetime_to_local


def summarize_jobs(jobs: List[dict]) -> dict:
    summary = {}
    total = len(jobs)
    summary["total_jobs"] = total
    if total == 0:
        summary.update(
            {
                "first_job": None,
                "last_job": None,
                "conclusions": {},
                "unique_jobs": 0,
            }
        )
        return summary

    # assume jobs are in chronological order; take first and last
    first = jobs[0]
    last = jobs[-1]
    summary["first_job"] = first
    summary["last_job"] = last

    # count conclusions (e.g. success, failure, cancelled, etc.)
    concl_counter = Counter((j.get("conclusion") or "unknown") for j in jobs)
    summary["conclusions"] = dict(concl_counter)

    # unique job names
    job_names = {j.get("name") for j in jobs if j.get("name")}
    summary["unique_jobs"] = len(job_names)

    # aggregate counts by job name and capture a representative run_id (if available)
    name_counts = Counter()
    name_runs = {}
    for j in jobs:
        name = j.get("name") or "<unnamed>"
        name_counts[name] += 1
        # prefer to capture the run_id if available
        if name not in name_runs:
            run_id = j.get("run_id") or j.get("runId") or None
            if run_id:
                name_runs[name] = run_id

    summary["jobs_by_name"] = {
        k: {"count": v, "run_id": name_runs.get(k)} for k, v in name_counts.items()
    }

    return summary


def print_job(first, last) -> None:
    print("")
    print("First job:")
    created_at = first.get("created_at")
    started_at = first.get("started_at")
    ended_at = first.get("completed_at") or first.get("updated_at")
    print(f"  Created at: {datetime_to_local(created_at)}")
    print(f"  Started at: {datetime_to_local(started_at)}")
    print(f"  Completed/Updated at: {datetime_to_local(ended_at)}")

    print("")
    print("Last job:")
    created_at = last.get("created_at")
    started_at = last.get("started_at")
    ended_at = last.get("completed_at") or last.get("updated_at")
    print(f"  Created at: {datetime_to_local(created_at)}")
    print(f"  Started at: {datetime_to_local(started_at)}")
    print(f"  Completed/Updated at: {datetime_to_local(ended_at)}")


def print_summary(summary: dict, max_jobs: int = 10) -> None:
    if summary.get("total_jobs", 0) == 0:
        print("No job executions available.")
        return

    print("")
    print("Jobs summary:")
    print(f"  Total job executions: {summary['total_jobs']}")

    # conclusions breakdown
    concls = summary.get("conclusions", {})
    if concls:
        print("")
        print("Conclusions:")
        for k, v in sorted(concls.items(), key=lambda x: x[1], reverse=True):
            print(f"  {k:10s}: {v}")

    print(f"  Unique job names: {summary.get('unique_jobs', 0)}")

    jobs_by_name = summary.get("jobs_by_name", {})
    if jobs_by_name:
        print("")
        print("Executions by job name:")
        sorted_items = sorted(
            jobs_by_name.items(), key=lambda x: x[1].get("count", 0), reverse=True
        )
        for name, info in sorted_items[:max_jobs]:
            cnt = info.get("count", 0)
            run_id = info.get("run_id") or "<no run_id>"
            print(f"  {cnt:4d}  {name}  (run_id: {run_id})")

    # print first/last with formatted dates
    first = summary["first_job"]
    last = summary["last_job"]

    print_job(first, last)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Print a quick summary of job executions"
    )
    parser.add_argument(
        "--max-jobs",
        type=int,
        default=10,
        help="Maximum number of job names to list in the summary (default: 10)",
    )
    args = parser.parse_args()

    lw = LoadWorkflows()
    jobs = lw.jobs()
    summary = summarize_jobs(jobs)
    print_summary(summary, max_jobs=args.max_jobs)
