from software_metrics_machine.core.infrastructure.pandas import pd

from software_metrics_machine.core.infrastructure.base_viewer import (
    BaseViewer,
    PlotResult,
)
from software_metrics_machine.apps.components.barchart_stacked import (
    BarchartStacked,
)
from software_metrics_machine.core.pipelines.aggregates.jobs_by_status import (
    JobsByStatus,
)
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)


class ViewJobsByStatus(BaseViewer):

    def __init__(self, repository: PipelinesRepository):
        self.barchart = BarchartStacked(repository=repository)
        self.repository: PipelinesRepository = repository

    def main(
        self,
        job_name: str,
        workflow_path: str | None = None,
        with_pipeline: bool = False,
        aggregate_by_week: bool = False,
        pipeline_raw_filters: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
        raw_filters: str | None = None,
    ) -> PlotResult:
        aggregate = JobsByStatus(repository=self.repository).main(
            job_name=job_name,
            workflow_path=workflow_path,
            aggregate_by_week=aggregate_by_week,
            pipeline_raw_filters=pipeline_raw_filters,
            start_date=start_date,
            end_date=end_date,
            raw_filters=raw_filters,
        )

        status_counts = aggregate.status_counts
        runs = aggregate.runs
        dates = aggregate.dates
        conclusions = aggregate.conclusions
        matrix = aggregate.matrix
        display_job_name = aggregate.display_job_name
        display_workflow_name = aggregate.display_pipeline_name
        total_runs = len(runs)

        status_data = [{"Status": k, "Count": v} for k, v in status_counts.items()]
        status_bars = self.barchart.build_barchart(
            status_data,
            x="Status",
            y="Count",
            stacked=False,
            height=super().get_chart_height(),
            title=(
                f"Status of Workflows - {total_runs} runs"
                if not workflow_path
                else f"Status of Workflows ({workflow_path}) - {total_runs} runs"
            ),
            xrotation=45,
            tools=super().get_tools(),
            color=super().get_color(),
        )

        timeline_data = []
        for j, period in enumerate(dates):
            for i, conc in enumerate(conclusions):
                runs_count = (
                    matrix[i][j] if i < len(matrix) and j < len(matrix[0]) else 0
                )
                timeline_data.append(
                    {"Period": period, "Conclusion": conc, "Runs": runs_count}
                )

        timeline_bars = self.barchart.build_barchart(
            timeline_data,
            x="Period",
            y="Runs",
            group="Conclusion",
            stacked=True,
            height=super().get_chart_height(),
            xrotation=45,
            title=(
                f'Executions of job "{display_job_name}" in workflow "{display_workflow_name}" by {'week' if aggregate_by_week else 'day'} (stacked by conclusion)'  # noqa
            ),
            tools=super().get_tools(),
        )

        if with_pipeline:
            layout = (status_bars + timeline_bars).cols(2)
            chart = layout
        else:
            chart = timeline_bars

        df = pd.DataFrame(status_data)

        if df.empty:
            return PlotResult(
                chart, f"No jobs to plot. {len(runs)} pipeline runs found."
            )

        return PlotResult(chart, df)
