from collections import defaultdict
from typing import List, Tuple
from software_metrics_machine.core.infrastructure.pandas import pd

import holoviews as hv

from software_metrics_machine.core.infrastructure.base_viewer import (
    BaseViewer,
    PlotResult,
)
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)


class ViewJobsTopFailed(BaseViewer):
    def __init__(self, repository: PipelinesRepository):
        self.repository: PipelinesRepository = repository

    def main(
        self,
        start_date: str | None = None,
        end_date: str | None = None,
        raw_filters: dict = {},
        jobs_selector: str | None = None,
    ) -> PlotResult:
        filters = {"start_date": start_date, "end_date": end_date}
        jobs = self.repository.jobs(filters=filters)

        failures_by_date_job: dict[Tuple[str, str], int] = defaultdict(int)
        for j in jobs:
            name = j.name
            conclusion = j.conclusion
            created = j.created_at
            if conclusion == "failure" and created:
                try:
                    dt = pd.to_datetime(created)
                    date_str = dt.date().isoformat()
                except Exception:
                    date_str = str(created)
                failures_by_date_job[(date_str, name)] += 1

        data = [
            {"Date": date, "Job": job, "Failures": count}
            for (date, job), count in failures_by_date_job.items()
        ]

        job_totals: dict = defaultdict(int)
        for row in data:
            job_totals[row["Job"]] += row["Failures"]

        top_jobs: List[str] = sorted(job_totals, reverse=True)

        data_list: List[dict[str, object]] = [
            row for row in data if row["Job"] in top_jobs
        ]

        bars = hv.Bars(data_list, ["Date", "Job"], "Failures").opts(
            stacked=True,
            legend_position="right",
            width=900,
            height=400,
            xrotation=45,
            title="Top Failed Jobs Over Time (stacked by job)",
        )

        return PlotResult(bars, pd.DataFrame(data))
