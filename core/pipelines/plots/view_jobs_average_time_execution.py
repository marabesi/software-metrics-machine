import pandas as pd
import holoviews as hv

from core.infrastructure.base_viewer import BaseViewer, PlotResult
from apps.dashboard.components.barchart_stacked import build_barchart
from core.pipelines.aggregates.jobs_average_time_execution import (
    JobsByAverageTimeExecution,
)
from core.pipelines.pipelines_repository import PipelinesRepository

hv.extension("bokeh")


class ViewJobsByAverageTimeExecution(BaseViewer):

    def __init__(self, repository: PipelinesRepository):
        self.repository = repository

    def main(
        self,
        workflow_path: str | None = None,
        out_file: str | None = None,
        raw_filters: str | None = None,
        top: int = 20,
        exclude_jobs: str = None,
        start_date: str | None = None,
        end_date: str | None = None,
        force_all_jobs: bool = False,
        job_name: str | None = None,
        pipeline_raw_filters: str | None = None,
    ) -> PlotResult:
        result = JobsByAverageTimeExecution(repository=self.repository).main(
            workflow_path=workflow_path,
            raw_filters=raw_filters,
            top=top,
            exclude_jobs=exclude_jobs,
            start_date=start_date,
            end_date=end_date,
            force_all_jobs=force_all_jobs,
            job_name=job_name,
            pipeline_raw_filters=pipeline_raw_filters,
        )
        averages = result.averages
        runs = result.runs
        jobs = result.jobs
        counts = result.counts
        total_runs = len(runs)
        total_jobs = len(jobs)

        if not averages:
            print("No job durations found after filtering")
            empty = hv.Text(0, 0, "No job durations found").opts(
                height=super().get_chart_height()
            )
            return PlotResult(plot=empty, data=pd.DataFrame(averages))

        names, mins = zip(*averages)

        data = []
        for name, val in zip(names, mins):
            data.append({"job_name": name, "value": val, "count": counts.get(name, 0)})

        title = (
            f"Top {len(names)} jobs by average duration for {total_runs} runs - {total_jobs} jobs"
            if not workflow_path
            else f"Top {len(names)} jobs by average duration for '{workflow_path}' - {total_runs} runs - {total_jobs} jobs"  # noqa
        )

        chart = build_barchart(
            data,
            x="job_name",
            y="value",
            stacked=False,
            height=super().get_chart_height(),
            title=title,
            xrotation=0,
            label_generator=super().build_labels_above_bars,
            out_file=out_file,
            tools=super().get_tools(),
            color=super().get_color(),
        )

        df = pd.DataFrame(averages)

        return PlotResult(chart, df)
