import pandas as pd
import holoviews as hv

from core.infrastructure.base_viewer import MatplotViewer, PlotResult
from core.pipelines.aggregates.jobs_average_time_execution import (
    JobsByAverageTimeExecution,
)
from core.pipelines.pipelines_repository import PipelinesRepository

hv.extension("bokeh")


class ViewJobsByAverageTimeExecution(MatplotViewer):

    def __init__(self, repository: PipelinesRepository):
        self.repository = repository

    def main(
        self,
        workflow_path: str | None = None,
        out_file: str | None = None,
        _cli_filters: dict = {},
        top: int = 20,
        exclude_jobs: str = None,
        start_date: str | None = None,
        end_date: str | None = None,
        force_all_jobs: bool = False,
        job_name: str | None = None,
    ) -> PlotResult:
        result = JobsByAverageTimeExecution(repository=self.repository).main(
            workflow_path=workflow_path,
            _cli_filters=_cli_filters,
            top=top,
            exclude_jobs=exclude_jobs,
            start_date=start_date,
            end_date=end_date,
            force_all_jobs=force_all_jobs,
            job_name=job_name,
        )
        averages = result.averages
        runs = result.runs
        jobs = result.jobs
        counts = result.counts

        if not averages:
            print("No job durations found after filtering")
            # create a small hv.Text chart to show the message
            empty = hv.Text(0, 0, "No job durations found").opts(width=600, height=200)
            return PlotResult(matplotlib=empty, data=pd.DataFrame(averages))

        names, mins = zip(*averages)

        data = []
        for name, val in zip(names, mins):
            data.append({"name": name, "value": val, "count": counts.get(name, 0)})

        bars = hv.Bars(data, "name", "value").opts(
            tools=["hover"],
            color="#4c78a8",
            width=900,
            height=500,
            xrotation=0,
            title=(
                f"Top {len(names)} jobs by average duration for {len(runs)} runs - {len(jobs)} jobs"
                if not workflow_path
                else f"Top {len(names)} jobs by average duration for '{workflow_path}' - {len(runs)} runs - {len(jobs)} jobs"  # noqa: E501
            ),
            xlabel="",
            ylabel="Average job duration (minutes)",
        )

        labels_data = []
        for i, d in enumerate(data):
            # place label slightly to the right of the bar value
            labels_data.append(
                {
                    "x": d["name"],
                    "y": d["value"] + max(0.1, max(mins) * 0.01),
                    "text": f"{d['value']:.2f}m ({d['count']})",
                }
            )

        labels = hv.Labels(labels_data, ["x", "y"], "text").opts(text_font_size="8pt")

        chart = bars * labels

        df = pd.DataFrame(averages)

        if out_file:
            hv.save(chart, out_file)

        return PlotResult(chart, df)
