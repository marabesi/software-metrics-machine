from dataclasses import dataclass
from typing import List
from collections import Counter, defaultdict
from datetime import datetime

from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)
from software_metrics_machine.core.pipelines.pipelines_types import PipelineRun


@dataclass
class JobByStatusResult:
    status_counts: Counter
    dates: List[str]
    runs: List[PipelineRun]
    conclusions: List[str]
    matrix: List[List[int]]
    display_job_name: str
    display_pipeline_name: str


class JobsByStatus:

    def __init__(self, repository: PipelinesRepository):
        self.repository = repository

    def __count_delivery_by_day(self, jobs, job_name: str):
        """Return (dates, conclusions, matrix) grouping delivery job executions by day and conclusion.

        dates: list of YYYY-MM-DD strings (unknown last)
        conclusions: ordered list of conclusion keys (e.g. ['success','failure',...])
        matrix: list of rows where each row corresponds to a conclusion and contains counts per date
        """
        per_day = defaultdict(Counter)
        for j in jobs:
            name = (j.get("name") or "").strip()
            if name.lower() != job_name:
                continue
            created = j.get("created_at") or j.get("started_at")
            if created:
                try:
                    dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
                    date_key = dt.date().isoformat()
                except Exception:
                    date_key = created
            else:
                date_key = "unknown"
            conclusion = (j.get("conclusion") or "unknown").lower()
            per_day[date_key][conclusion] += 1

        if not per_day:
            return [], [], []

        dates = sorted(d for d in per_day.keys() if d != "unknown")
        if "unknown" in per_day:
            dates.append("unknown")

        # determine conclusion order: prefer success, failure, then alphabetic
        all_concs = set()
        for c in per_day.values():
            all_concs.update(c.keys())
        ordered = []
        for pref in ("success", "failure"):
            if pref in all_concs:
                ordered.append(pref)
                all_concs.remove(pref)
        ordered += sorted(all_concs)

        matrix = []
        for conc in ordered:
            row = [per_day[d].get(conc, 0) for d in dates]
            matrix.append(row)

        return dates, ordered, matrix

    def count_delivery_by_week(self, jobs, job_name: str):
        """Return (weeks, conclusions, matrix) grouping job executions by ISO week and conclusion.

        weeks are strings like YYYY-Www (e.g. 2025-W35)
        """
        from collections import defaultdict, Counter

        per_week = defaultdict(Counter)
        for j in jobs:
            name = (j.get("name") or "").strip()
            if name.lower() != job_name:
                continue
            created = j.get("created_at") or j.get("started_at")
            if created:
                try:
                    dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
                    week_key = f"{dt.isocalendar()[0]}-W{dt.isocalendar()[1]:02d}"
                except Exception:
                    week_key = created
            else:
                week_key = "unknown"
            conclusion = (j.get("conclusion") or "unknown").lower()
            per_week[week_key][conclusion] += 1

        if not per_week:
            return [], [], []

        weeks = sorted(w for w in per_week.keys() if w != "unknown")
        if "unknown" in per_week:
            weeks.append("unknown")

        all_concs = set()
        for cnt in per_week.values():
            all_concs.update(cnt.keys())
        ordered = []
        for pref in ("success", "failure"):
            if pref in all_concs:
                ordered.append(pref)
                all_concs.remove(pref)
        ordered += sorted(all_concs)

        matrix = []
        for concl in ordered:
            row = [per_week[w].get(concl, 0) for w in weeks]
            matrix.append(row)

        return weeks, ordered, matrix

    def main(
        self,
        job_name: str,
        workflow_path: str | None = None,
        aggregate_by_week: bool = False,
        raw_filters: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
        force_all_jobs: bool = False,
    ) -> None:
        filters = {
            "start_date": start_date,
            "end_date": end_date,
            **self.repository.parse_raw_filters(raw_filters),
        }
        print(f"Applying date filter: {filters}")
        runs = self.repository.runs(filters=filters)
        jobs = self.repository.jobs(filters={**filters, "name": job_name})

        # optional filter by workflow name (case-insensitive substring match)
        if workflow_path:
            wf_low = workflow_path.lower()
            runs = [r for r in runs if (r.get("path") or "").lower().find(wf_low) != -1]

        if not force_all_jobs:
            # restrict jobs to only those belonging to the selected runs
            run_ids = {r.get("id") for r in runs if r.get("id") is not None}
            jobs = [j for j in jobs if j.get("run_id") in run_ids]

        print(f"Found {len(runs)} workflow runs and {len(jobs)} jobs after filtering")

        # derive display labels from job objects if possible
        display_job_name = job_name or "<job>"
        display_workflow_name = workflow_path or None
        # prefer explicit fields on job objects
        for j in jobs:
            if not display_job_name or display_job_name == "<job>":
                if j.get("name"):
                    display_job_name = j.get("name")
            if not display_workflow_name:
                wf = j.get("workflow_path") or j.get("workflow") or j.get("run_name")
                if wf:
                    display_workflow_name = wf
            if display_job_name and display_workflow_name:
                break
        # fallback: try to resolve workflow name via run_id -> run name mapping
        if not display_workflow_name:
            run_map = {r.get("id"): r.get("path") for r in runs if r.get("id")}
            for j in jobs:
                rid = j.get("run_id") or j.get("runId")
                if rid and rid in run_map:
                    display_workflow_name = run_map[rid]
                    break
        if not display_workflow_name:
            display_workflow_name = "<any>"

        # left: workflow conclusions (existing)
        status_counts = Counter(run.get("conclusion") or "undefined" for run in runs)

        # right: delivery executions grouped by conclusion (day or week)
        if aggregate_by_week:
            dates, conclusions, matrix = self.count_delivery_by_week(
                jobs, job_name=job_name
            )
        else:
            dates, conclusions, matrix = self.__count_delivery_by_day(
                jobs, job_name=job_name
            )

        return JobByStatusResult(
            status_counts,
            dates,
            runs,
            conclusions,
            matrix,
            display_job_name,
            display_workflow_name,
        )
