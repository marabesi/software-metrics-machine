import pandas as pd
import holoviews as hv

from core.infrastructure.base_viewer import BaseViewer, PlotResult
from core.pipelines.aggregates.jobs_by_status import JobsByStatus
from core.pipelines.pipelines_repository import PipelinesRepository

hv.extension("bokeh")


class ViewJobsByStatus(BaseViewer):

    def __init__(self, repository: PipelinesRepository):
        self.repository = repository

    def main(
        self,
        job_name: str,
        workflow_path: str | None = None,
        out_file: str | None = None,
        with_pipeline: bool = False,
        aggregate_by_week: bool = False,
        raw_filters: dict = {},
        start_date: str | None = None,
        end_date: str | None = None,
        force_all_jobs: bool = False,
    ) -> PlotResult:
        aggregate = JobsByStatus(repository=self.repository).main(
            job_name=job_name,
            workflow_path=workflow_path,
            aggregate_by_week=aggregate_by_week,
            raw_filters=raw_filters,
            start_date=start_date,
            end_date=end_date,
            force_all_jobs=force_all_jobs,
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
        status_bars = hv.Bars(status_data, "Status", "Count").opts(
            tools=super().get_tools(),
            color=super().get_color(),
            height=super().get_chart_height(),
            title=(
                f"Status of Workflows - {total_runs} runs"
                if not workflow_path
                else f"Status of Workflows ({workflow_path}) - {total_runs} runs"
            ),
            xlabel="Status",
            ylabel="Count",
            xrotation=45,
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

        timeline_bars = hv.Bars(timeline_data, ["Period", "Conclusion"], "Runs").opts(
            stacked=True,
            width=super().get_chart_with(),
            height=super().get_chart_height(),
            xrotation=45,
            title=(
                f'Executions of job "{display_job_name}" in workflow "{display_workflow_name}" by {'week' if aggregate_by_week else 'day'} (stacked by conclusion)'  # noqa: E501
            ),
            tools=super().get_tools(),
        )

        if with_pipeline:
            layout = (status_bars + timeline_bars).cols(2)
            chart = layout
        else:
            chart = timeline_bars

        df = pd.DataFrame(runs)

        if out_file:
            try:
                hv.save(chart, out_file)
            except Exception:
                pass

        return PlotResult(chart, df)
