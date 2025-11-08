import pandas as pd
import holoviews as hv

from software_metrics_machine.core.infrastructure.base_viewer import (
    BaseViewer,
    PlotResult,
)
from software_metrics_machine.apps.dashboard.components.barchart_stacked import (
    build_barchart,
)
from software_metrics_machine.core.pipelines.aggregates.pipeline_execution_duration import (
    PipelineExecutionDuration,
)
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)

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
        raw_filters: str | None = None,
    ) -> PlotResult:
        result = PipelineExecutionDuration(repository=self.repository).main(
            workflow_path=workflow_path,
            start_date=start_date,
            end_date=end_date,
            max_runs=max_runs,
            metric=metric,
            sort_by=sort_by,
            raw_filters=raw_filters,
        )
        names = result.names
        values = result.values
        counts = result.counts
        # ylabel = result.ylabel
        title_metric = result.title_metric
        rows = result.rows
        data = []
        for name, val, cnt in zip(names, values, counts):
            data.append({"name": name, "value": val, "count": cnt})

        chart = build_barchart(
            data,
            x="name",
            y="value",
            stacked=False,
            height=super().get_chart_height(),
            title=f"Runs aggregated by name - {title_metric} ({len(rows)} items)",
            xrotation=45,
            label_generator=super().build_labels_above_bars,
            out_file=None,
            tools=super().get_tools(),
            color=super().get_color(),
        )

        df = pd.DataFrame(rows)

        if out_file:
            # get_screenshot_as_png(chart, filename=f"{self.repository.configuration.store_data}/run_duration.png")
            print(
                f"Saved plot to {self.repository.configuration.store_data}/run_duration.png"
            )

        return PlotResult(chart, df)
