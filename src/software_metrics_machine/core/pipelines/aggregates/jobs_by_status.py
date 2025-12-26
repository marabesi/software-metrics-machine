from dataclasses import dataclass
from typing import List, Optional
from collections import Counter, defaultdict
from datetime import datetime

from software_metrics_machine.core.infrastructure.logger import Logger
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)
from software_metrics_machine.core.pipelines.pipelines_types import (
    PipelineFilters,
    PipelineRun,
    PipelineJob,
)


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
        self.logger = Logger(configuration=self.repository.configuration).get_logger()

    def main(
        self,
        job_name: str,
        workflow_path: Optional[str] = None,
        aggregate_by_week: bool = False,
        pipeline_raw_filters: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        raw_filters: Optional[str] = None,
    ) -> JobByStatusResult:
        common_filters: dict = {
            "start_date": start_date,
            "end_date": end_date,
        }

        runs = self.repository.runs(filters=PipelineFilters(**common_filters))

        pipeline_filters = {
            **common_filters,
            "workflow_path": workflow_path,
            **self.repository.parse_raw_filters(pipeline_raw_filters),
        }
        self.logger.debug(f"Applying date filter for job by status: {pipeline_filters}")

        job_filter = {**common_filters, "raw_filters": raw_filters, "name": job_name}

        jobs = self.repository.jobs(filters=job_filter)

        self.logger.debug(
            f"Found {len(runs)} workflow runs and {len(jobs)} jobs after filtering"
        )

        # derive display labels from job objects if possible
        display_job_name = job_name or "<job>"
        display_workflow_name = workflow_path or None
        # prefer explicit fields on job objects
        for j in jobs:
            if not display_job_name or display_job_name == "<job>":
                if j.name:
                    display_job_name = j.name
            if not display_workflow_name:
                wf = j.workflow_name
                if wf:
                    display_workflow_name = wf
            if display_job_name and display_workflow_name:
                break
        # fallback: try to resolve workflow name via run_id -> run name mapping
        if not display_workflow_name:
            run_map = {r.id: r.path for r in runs if r.id}
            for j in jobs:
                rid = j.run_id
                if rid and rid in run_map:
                    display_workflow_name = run_map[rid]
                    break
        if not display_workflow_name:
            display_workflow_name = "<any>"

        status_counts = Counter(job.conclusion for job in jobs)

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

    def count_delivery_by_week(self, jobs: List[PipelineJob], job_name: str):
        per_week: dict[str, dict[str, int]] = defaultdict(Counter)
        for j in jobs:
            name = j.name
            if name.lower() != job_name:
                continue
            created = j.created_at
            dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
            week_key = f"{dt.isocalendar()[0]}-W{dt.isocalendar()[1]:02d}"
            conclusion = j.conclusion
            if conclusion:
                per_week[week_key][conclusion] += 1

        if not per_week:
            return [], [], []

        weeks = sorted(w for w in per_week.keys() if w != "unknown")
        if "unknown" in per_week:
            weeks.append("unknown")

        all_concs = set[str]()
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

    def __count_delivery_by_day(self, jobs: List[PipelineJob], job_name: str):
        per_day: dict[str, dict[str, int]] = defaultdict(Counter)
        for j in jobs:
            name = j.name
            if name != job_name:
                continue
            created = j.created_at
            dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
            date_key = dt.date().isoformat()
            conclusion = j.conclusion
            if conclusion:
                per_day[date_key][conclusion] += 1

        if not per_day:
            return [], [], []

        dates = sorted(d for d in per_day.keys() if d != "unknown")
        if "unknown" in per_day:
            dates.append("unknown")

        # determine conclusion order: prefer success, failure, then alphabetic
        all_concs = set[str]()
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
