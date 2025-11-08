from collections import defaultdict
import pandas as pd

import holoviews as hv

from software_metrics_machine.core.infrastructure.base_viewer import (
    BaseViewer,
    PlotResult,
)
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)

hv.extension("bokeh")


class ViewJobsTopFailed(BaseViewer):
    def __init__(self, repository: PipelinesRepository):
        self.repository = repository

    def main(
        self,
        out_file: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
        raw_filters: dict = {},
        jobs_selector: str | None = None,
    ) -> PlotResult:
        filters = {"start_date": start_date, "end_date": end_date}
        jobs = self.repository.jobs(filters=filters)

        failures_by_date_job = defaultdict(int)
        for j in jobs:
            name = (j.get("name") or "<unknown>").strip()
            conclusion = (j.get("conclusion") or "unknown").lower()
            created = j.get("created_at") or j.get("started_at")
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
        job_totals = defaultdict(int)
        for row in data:
            job_totals[row["Job"]] += row["Failures"]
        top_jobs = sorted(job_totals, key=job_totals.get, reverse=True)
        data = [row for row in data if row["Job"] in top_jobs]

        bars = hv.Bars(data, ["Date", "Job"], "Failures").opts(
            stacked=True,
            legend_position="right",
            width=900,
            height=400,
            xrotation=45,
            title="Top Failed Jobs Over Time (stacked by job)",
        )

        if out_file:
            hv.save(bars, out_file)

        return PlotResult(bars, pd.DataFrame(data))
