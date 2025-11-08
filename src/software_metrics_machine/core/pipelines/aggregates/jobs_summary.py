from collections import Counter
from typing import List
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)


class JobsSummary:
    def __init__(self, repository: PipelinesRepository):
        self.repository = repository

    def summarize_jobs(self, jobs: List[dict]) -> dict:
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
        runs = self.repository.runs() or []
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
