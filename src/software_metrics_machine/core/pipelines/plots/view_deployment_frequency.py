from datetime import datetime

import pandas as pd
from bokeh.plotting import figure
from bokeh.models import ColumnDataSource, LabelSet, Span
from bokeh.layouts import column
import panel as pn

from software_metrics_machine.core.infrastructure.base_viewer import (
    BaseViewer,
    PlotResult,
)
from software_metrics_machine.core.pipelines.aggregates.deployment_frequency import (
    DeploymentFrequency,
)
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)


class ViewDeploymentFrequency(BaseViewer):
    def __init__(self, repository: PipelinesRepository):
        self.repository = repository

    def plot(
        self,
        workflow_path: str,
        job_name: str,
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> PlotResult:
        aggregated = DeploymentFrequency(repository=self.repository).execute(
            workflow_path=workflow_path,
            job_name=job_name,
            start_date=start_date,
            end_date=end_date,
        )

        daily_counts = aggregated["daily_counts"]
        weekly_counts = aggregated["weekly_counts"]
        monthly_counts = aggregated["monthly_counts"]
        days = aggregated["days"]
        weeks = aggregated["weeks"]
        months = aggregated["months"]

        # Helper to create a bar figure
        def _make_bar_fig(x, counts, title, color):
            src = ColumnDataSource(dict(x=list(range(len(x))), label=x, count=counts))
            p = figure(
                title=title,
                x_range=(-0.5, max(0, len(x) - 0.5)),
                tools="hover,pan,wheel_zoom,reset,save",
                sizing_mode="stretch_width",
                height=int(self.get_chart_height() / 3),
            )
            p.vbar(x="x", top="count", width=0.9, fill_color=color, source=src)
            labels = LabelSet(
                x="x",
                y="count",
                text="count",
                source=src,
                text_align="center",
                text_baseline="bottom",
                text_font_size=self.get_font_size(),
            )
            p.add_layout(labels)
            # set categorical tick labels via major_label_overrides if provided
            p.xaxis.major_label_overrides = {i: str(v) for i, v in enumerate(x)}
            p.xaxis.major_label_orientation = 0.785  # 45 degrees
            p.yaxis.axis_label = "Deployments"
            return p

        daily_fig = _make_bar_fig(
            days, daily_counts, "Daily Deployment Frequency", "orange"
        )
        weekly_fig = _make_bar_fig(
            weeks, weekly_counts, "Weekly Deployment Frequency", "blue"
        )
        monthly_fig = _make_bar_fig(
            months, monthly_counts, "Monthly Deployment Frequency", "green"
        )

        # Add vertical separators on weekly plot where month changes
        try:
            week_dates = [datetime.strptime(week + "-1", "%Y-W%W-%w") for week in weeks]
            current_month = None
            for i, week_date in enumerate(week_dates):
                if current_month is None:
                    current_month = week_date.month
                if week_date.month != current_month:
                    sep = Span(
                        location=i - 0.5,
                        dimension="height",
                        line_color="gray",
                        line_dash="dashed",
                        line_alpha=0.7,
                    )
                    weekly_fig.add_layout(sep)
                    current_month = week_date.month
        except Exception:
            # if parsing fails, skip separators
            pass

        layout = column(daily_fig, weekly_fig, monthly_fig, sizing_mode="stretch_width")

        # Wrap layout in a Panel Bokeh pane so callers expecting a pane get a renderable object
        pane = pn.pane.Bokeh(layout)

        return PlotResult(plot=pane, data=pd.DataFrame(aggregated))
