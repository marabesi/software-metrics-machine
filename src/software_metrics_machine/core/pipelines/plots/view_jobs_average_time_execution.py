import pandas as pd
import holoviews as hv

from software_metrics_machine.core.infrastructure.base_viewer import (
    BaseViewer,
    PlotResult,
)
from software_metrics_machine.apps.dashboard.components.barchart_stacked import (
    build_barchart,
)
from software_metrics_machine.core.pipelines.aggregates.jobs_average_time_execution import (
    JobsByAverageTimeExecution,
)
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)
from typing import Optional

hv.extension("bokeh")


class ViewJobsByAverageTimeExecution(BaseViewer):

    def __init__(self, repository: PipelinesRepository):
        self.repository = repository

    def main(
        self,
        top: int = 20,
        workflow_path: Optional[str] = None,
        out_file: Optional[str] = None,
        raw_filters: Optional[str] = None,
        exclude_jobs: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        force_all_jobs: bool = False,
        job_name: Optional[str] = None,
        pipeline_raw_filters: Optional[str] = None,
    ) -> PlotResult:
        result = JobsByAverageTimeExecution(repository=self.repository).main(
            top=top,
            workflow_path=workflow_path,
            raw_filters=raw_filters,
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

        x = "job_name"
        y = "minutes"
        count = "count"

        data = []
        for name, val in zip(names, mins):
            data_structure = {x: name, y: val, count: counts.get(name, 0)}
            data.append(data_structure)

        title = (
            f"Top {len(names)} jobs by average duration for {total_runs} runs - {total_jobs} jobs"
            if not workflow_path
            else f"Top {len(names)} jobs by average duration for '{workflow_path}' - {total_runs} runs - {total_jobs} jobs"  # noqa
        )

        chart = build_barchart(
            data,
            x=x,
            y=y,
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
