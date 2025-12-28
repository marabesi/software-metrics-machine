from software_metrics_machine.core.infrastructure.pandas import pd

from software_metrics_machine.apps.components.scatter_with_trend import ScatterWithTrend
from software_metrics_machine.core.infrastructure.base_viewer import (
    BaseViewer,
    PlotResult,
)
from software_metrics_machine.apps.components.barchart_stacked import (
    BarchartStacked,
)
from software_metrics_machine.core.pipelines.aggregates.pipeline_execution_duration import (
    PipelineExecutionDuration,
)
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)


class ViewPipelineExecutionRunsDuration(BaseViewer):
    def __init__(self, repository: PipelinesRepository):
        self.barchart = BarchartStacked(repository=repository)
        self.scater_with_trend = ScatterWithTrend()
        self.repository: PipelinesRepository = repository

    def main(
        self,
        workflow_path: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
        max_runs: int = 50,
        metric: str = "avg",
        sort_by: str = "avg",
        raw_filters: str | None = None,
        aggregate_by_day: bool = False,
    ) -> PlotResult:
        result = PipelineExecutionDuration(repository=self.repository).main(
            workflow_path=workflow_path,
            start_date=start_date,
            end_date=end_date,
            max_runs=max_runs,
            metric=metric,
            sort_by=sort_by,
            raw_filters=raw_filters,
            aggregate_by_day=aggregate_by_day,
        )
        names = result.names
        values = result.values
        counts = result.job_counts
        # ylabel = result.ylabel
        title_metric = result.title_metric
        rows = result.rows
        run_counts = result.run_counts
        data = []

        for name, val, cnt in zip(names, values, counts):
            data.append(
                {
                    "name": name,
                    "value": val,
                    "total_jobs": cnt,
                    "total_runs": run_counts,
                }
            )

        chart = self.barchart.build_barchart(
            data,
            x="name",
            y=["value", "total_jobs", "total_runs"],
            stacked=False,
            height=super().get_chart_height(),
            title=f"Runs aggregated by name - {title_metric} ({len(rows)} items)",
            xrotation=45,
            tools=super().get_tools(),
            color=super().get_color(),
        )

        overlay = self.scater_with_trend.build_scatter_with_trend(
            data=result.runs,
            x="duration_in_minutes",
            y="short_name",
            title="Pipeline runs",
            height=super().get_chart_height(),
            point_size=12,
            tools=["hover"],
        )

        df = pd.DataFrame(data)

        return PlotResult([chart, overlay], df)
