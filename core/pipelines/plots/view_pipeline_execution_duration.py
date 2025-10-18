import pandas as pd
import holoviews as hv

from core.infrastructure.base_viewer import BaseViewer, PlotResult
from core.pipelines.aggregates.pipeline_execution_duration import (
    PipelineExecutionDuration,
)
from core.pipelines.pipelines_repository import PipelinesRepository

hv.extension("bokeh")


class ViewPipelineExecutionRunsDuration(BaseViewer):
    def __init__(self, repository: PipelinesRepository):
        self.repository = repository

    def main(
        self,
        out_file: str | None = None,
        workflow_path: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
        max_runs: int = 50,
        metric: str = "avg",
        sort_by: str = "avg",
    ) -> PlotResult:
        result = PipelineExecutionDuration(repository=self.repository).main(
            workflow_path=workflow_path,
            start_date=start_date,
            end_date=end_date,
            max_runs=max_runs,
            metric=metric,
            sort_by=sort_by,
        )
        names = result.names
        values = result.values
        counts = result.counts
        ylabel = result.ylabel
        title_metric = result.title_metric
        rows = result.rows
        data = []
        for name, val, cnt in zip(names, values, counts):
            data.append({"name": name, "value": val, "count": cnt})

        bars = hv.Bars(data, "name", "value").opts(
            tools=super().get_tools(),
            color=super().get_color(),
            height=super().get_chart_height(),
            xrotation=45,
            title=f"Runs aggregated by name - {title_metric} ({len(rows)} items)",
            xlabel="Pipeline",
            ylabel=ylabel,
        )

        labels_data = []
        for i, d in enumerate(data):
            labels_data.append(
                {"x": d["name"], "y": d["value"] + 2, "text": f"{d['value']:.1f}"}
            )

        labels = hv.Labels(labels_data, ["x", "y"], "text").opts(
            text_font_size=super().get_font_size()
        )

        chart = bars * labels

        df = pd.DataFrame(rows)

        if out_file:
            # get_screenshot_as_png(chart, filename=f"{self.repository.configuration.store_data}/run_duration.png")
            print(
                f"Saved plot to {self.repository.configuration.store_data}/run_duration.png"
            )

        return PlotResult(chart, df)
