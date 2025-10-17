from collections import Counter
from typing import List
from core.infrastructure.configuration.configuration_builder import (
    ConfigurationBuilder,
    Driver,
)
from core.pipelines.pipelines_repository import LoadWorkflows
from core.infrastructure.date_and_time import datetime_to_local

lw = LoadWorkflows(configuration=ConfigurationBuilder(driver=Driver.JSON).build())


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

    # build a mapping from run_id -> workflow name by loading runs if available
    runs = lw.runs() or []
    run_id_to_name = {r.get("id"): r.get("name") for r in runs if r.get("id")}

    # unique composite job names (job.name + workflow name)
    composite_names = set()

    # aggregate counts by composite job name and capture a representative run_id (if available)
    name_counts = Counter()
    name_runs = {}
    for j in jobs:
        job_name = j.get("name") or "<unnamed>"
        # try to obtain workflow/run name from job metadata or lookup by run_id
        wf_name = j.get("workflow_name") or j.get("workflow") or j.get("run_name")
        if not wf_name:
            run_id = j.get("run_id") or j.get("runId")
            wf_name = run_id_to_name.get(run_id)

        if wf_name:
            composite = f"{job_name} :: {wf_name}"
        else:
            composite = job_name

        composite_names.add(composite)
        name_counts[composite] += 1
        # prefer to capture the run_id if available for this composite key
        if composite not in name_runs:
            run_id = j.get("run_id") or j.get("runId") or None
            if run_id:
                name_runs[composite] = run_id

    summary["unique_jobs"] = len(composite_names)
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


def print_summary(max_jobs: int = 10) -> None:
    summary = summarize_jobs(lw.jobs())
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
            print(f"  {cnt:4d}  {name} ")

    # print first/last with formatted dates
    first = summary["first_job"]
    last = summary["last_job"]

    print_job(first, last)
