from software_metrics_machine.core.infrastructure.pandas import pd


from software_metrics_machine.core.infrastructure.base_viewer import (
    BaseViewer,
    PlotResult,
)
from software_metrics_machine.apps.components.barchart_stacked import (
    BarchartStacked,
)
from software_metrics_machine.core.pipelines.aggregates.pipeline_by_status import (
    PipelineByStatus,
)
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)


class ViewPipelineByStatus(BaseViewer):
    def __init__(self, repository: PipelinesRepository):
        self.barchart = BarchartStacked(repository=repository)
        self.repository: PipelinesRepository = repository

    def main(
        self,
        workflow_path: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
        target_branch: str | None = None,
        raw_filters: str | None = None,
    ) -> PlotResult:
        result = PipelineByStatus(repository=self.repository).main(
            workflow_path=workflow_path,
            target_branch=target_branch,
            start_date=start_date,
            end_date=end_date,
            raw_filters=raw_filters,
        )
        status_counts = result.status_counts
        runs = result.runs
        total_runs = len(runs)

        data = [{"Status": k, "Count": v} for k, v in status_counts.items()]

        title = f"Status of Pipeline Runs - ({total_runs} in total)"

        if workflow_path:
            title = (
                f"Status of Pipeline Runs for '{workflow_path}' - Total {total_runs}"
            )

        chart = self.barchart.build_barchart(
            data,
            x="Status",
            y="Count",
            stacked=False,
            height=super().get_chart_height(),
            title=title,
            xrotation=45,
            tools=super().get_tools(),
            color=super().get_color(),
        )

        df = pd.DataFrame(data)

        return PlotResult(chart, df)
