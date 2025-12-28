from typing import List
from software_metrics_machine.core.infrastructure.pandas import pd
import holoviews as hv
from bokeh.models import Span  # type: ignore[attr-defined]


from software_metrics_machine.core.infrastructure.base_viewer import (
    BaseViewer,
    PlotResult,
)
from software_metrics_machine.apps.components.barchart_stacked import (
    BarchartStacked,
)
from software_metrics_machine.core.pipelines.aggregates.pipeline_workflow_runs_by_week_or_month import (
    PipelineWorkflowRunsByWeekOrMonth,
)
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)


class ViewWorkflowRunsByWeekOrMonth(BaseViewer):

    def __init__(self, repository: PipelinesRepository):
        self.barchart = BarchartStacked(repository=repository)
        self.repository: PipelinesRepository = repository

    def main(
        self,
        aggregate_by: str,
        workflow_path: str | None = None,
        raw_filters: str | None = None,
        include_defined_only: bool = False,
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> PlotResult:
        result = PipelineWorkflowRunsByWeekOrMonth(repository=self.repository).main(
            aggregate_by=aggregate_by,
            workflow_path=workflow_path,
            raw_filters=raw_filters,
            include_defined_only=include_defined_only,
            start_date=start_date,
            end_date=end_date,
        )

        rep_dates = result.rep_dates
        periods = result.periods
        workflow_names = result.workflow_names
        data_matrix = result.data_matrix
        runs = result.runs
        total_runs = len(runs)
        df = pd.DataFrame(runs)

        # handle empty or inconsistent data to avoid HoloViews stack error
        if not periods or not workflow_names:
            placeholder = hv.Text(0.5, 0.5, "No data to display").opts(
                height=super().get_chart_height(),
                text_font_size=super().get_font_size(),
            )
            return PlotResult(placeholder, df)

        # Ensure data_matrix has expected dimensions; create zero matrix if missing
        if not data_matrix or not any(any(row) for row in data_matrix):
            # all zeros or empty
            placeholder = hv.Text(0.5, 0.5, "No data to display").opts(
                height=super().get_chart_height(),
                text_font_size=super().get_font_size(),
            )
            return PlotResult(placeholder, df)

        # build stacked data for HoloViews using numeric x-axis (Time)
        data: List[dict] = []
        for j, period in enumerate(periods):
            for i, name in enumerate(workflow_names):
                run_point: int = data_matrix[i][j] or 0
                data.append({"Period": period, "Workflow": name, "Runs": run_point})

        # guard: if all Runs are zero, avoid stacked bars with empty stacks
        data_points: List[int] = [d["Runs"] for d in data]
        total_runs = sum(data_points)

        if total_runs == 0:
            placeholder = hv.Text(0.5, 0.5, "No runs in selected range").opts(
                height=super().get_chart_height(),
                text_font_size=super().get_font_size(),
            )
            return PlotResult(placeholder, df)

        stacked = True
        x = "Period"
        y = "Runs"

        group = "Workflow"

        title = f"Workflow runs per {'week' if aggregate_by == 'week' else 'month'} by workflow name ({total_runs} in total)"  # noqa
        plot = self.barchart.build_barchart(
            data,
            x=x,
            y=y,
            group=group,
            stacked=stacked,
            height=super().get_chart_height(),
            title=title,
            xrotation=45,
            tools=super().get_tools(),
        )

        if aggregate_by == "week" and rep_dates and len(rep_dates) > 1:
            month_boundaries = []
            if len(rep_dates) and rep_dates[0]:
                last_month: int = rep_dates[0].month
                for k in range(1, len(rep_dates)):
                    cur = rep_dates[k]
                    if cur and cur.month != last_month:
                        # position the divider between bars k-1 and k
                        month_boundaries.append(k - 0.5)
                        last_month = cur.month

                for x_plot in month_boundaries:
                    # If build_barchart returned a Bokeh Figure, add a Span annotation.
                    # Otherwise (Holoviews element) overlay a VLine as before.
                    try:
                        # Bokeh Figure has `add_layout` method
                        if hasattr(plot, "add_layout"):
                            span = Span(
                                location=x_plot,
                                dimension="height",
                                line_color="gray",
                                line_dash="dotted",
                                line_width=1,
                                line_alpha=0.6,
                            )
                            plot.add_layout(span)
                        else:
                            plot = plot * hv.VLine(x_plot).opts(
                                color="gray",
                                line_dash="dotted",
                                line_width=1,
                                alpha=0.6,
                            )
                    except Exception:
                        # fallback to holoviews overlay if anything unexpected occurs
                        plot = plot * hv.VLine(x_plot).opts(
                            color="gray", line_dash="dotted", line_width=1, alpha=0.6
                        )

        return PlotResult(plot, df)
