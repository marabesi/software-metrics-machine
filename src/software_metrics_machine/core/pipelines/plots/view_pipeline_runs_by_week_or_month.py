import pandas as pd
import holoviews as hv


from software_metrics_machine.core.infrastructure.base_viewer import (
    BaseViewer,
    PlotResult,
)
from software_metrics_machine.apps.dashboard.components.barchart_stacked import (
    build_barchart,
)
from software_metrics_machine.core.pipelines.aggregates.pipeline_workflow_runs_by_week_or_month import (
    PipelineWorkflowRunsByWekOrMonth,
)
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)

hv.extension("bokeh")


class ViewWorkflowRunsByWeekOrMonth(BaseViewer):

    def __init__(self, repository: PipelinesRepository):
        self.repository = repository

    def main(
        self,
        aggregate_by: str,
        workflow_path: str | None = None,
        out_file: str | None = None,
        raw_filters: str | None = None,
        include_defined_only: bool = False,
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> PlotResult:
        result = PipelineWorkflowRunsByWekOrMonth(repository=self.repository).main(
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
        data = []
        for j, period in enumerate(periods):
            for i, name in enumerate(workflow_names):
                try:
                    val = data_matrix[i][j]
                except Exception:
                    val = 0
                data.append(
                    {"Time": j, "Period": period, "Workflow": name, "Runs": val}
                )

        # guard: if all Runs are zero, avoid stacked bars with empty stacks
        total_runs = sum(d["Runs"] for d in data)
        if total_runs == 0:
            placeholder = hv.Text(0.5, 0.5, "No runs in selected range").opts(
                height=super().get_chart_height(),
                text_font_size=super().get_font_size(),
            )
            return PlotResult(placeholder, df)

        # choose tick step to avoid overcrowding (every 4 periods for weekly view by default)
        if aggregate_by == "week":
            tick_step = 4
        else:
            # for monthly view show every month
            tick_step = 1

        xticks = [(i, periods[i]) for i in range(0, len(periods), max(1, tick_step))]

        # use the shared barchart builder for stacked bars
        title = f"Workflow runs per {'week' if aggregate_by == 'week' else 'month'} by workflow name ({total_runs} in total)"  # noqa
        plot = build_barchart(
            data,
            x="Time",
            y="Runs",
            group="Workflow",
            stacked=True,
            height=super().get_chart_height(),
            title=title,
            xrotation=45,
            label_generator=None,
            out_file=None,
            tools=super().get_tools(),
        )

        # apply xticks and other display options
        try:
            plot = plot.opts(xticks=xticks, line_color=None, tools=super().get_tools())
        except Exception:
            # some hv types may not accept those opts directly; ignore if not applicable
            pass
        if aggregate_by == "week" and rep_dates and len(rep_dates) > 1:
            month_boundaries = []
            last_month = rep_dates[0].month
            for k in range(1, len(rep_dates)):
                cur = rep_dates[k]
                if cur.month != last_month:
                    # position the divider between bars k-1 and k
                    month_boundaries.append(k - 0.5)
                    last_month = cur.month

            for x in month_boundaries:
                plot = plot * hv.VLine(x).opts(
                    color="gray", line_dash="dotted", line_width=1, alpha=0.6
                )

        if out_file:
            try:
                hv.save(plot, out_file)
            except Exception:
                pass

        return PlotResult(plot, df)
