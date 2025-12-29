from datetime import datetime

from software_metrics_machine.core.infrastructure.pandas import pd
from bokeh.plotting import figure
from bokeh.models import ColumnDataSource, LabelSet, Span  # type: ignore[attr-defined]
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
        self.repository: PipelinesRepository = repository

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
        # aggregated.* are lists of DeploymentItem; extract labels and counts
        days = [d.date for d in aggregated.days]
        weeks = [w.date for w in aggregated.weeks]
        months = [m.date for m in aggregated.months]
        daily_counts = [d.count for d in aggregated.days]
        weekly_counts = [w.count for w in aggregated.weeks]
        monthly_counts = [m.count for m in aggregated.months]
        commit = [m.commit for m in aggregated.days]
        link = [m.link for m in aggregated.days]

        palette = super().get_palette(days)["colors"]
        color_days = palette[0]
        color_weeks = palette[9]
        color_months = palette[19]

        daily_fig = self._make_bar_fig(
            days, daily_counts, "Daily Deployment Frequency", color_days
        )
        weekly_fig = self._make_bar_fig(
            weeks, weekly_counts, "Weekly Deployment Frequency", color_weeks
        )
        monthly_fig = self._make_bar_fig(
            months, monthly_counts, "Monthly Deployment Frequency", color_months
        )

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

        layout = column(daily_fig, weekly_fig, monthly_fig, sizing_mode="stretch_width")

        pane = pn.pane.Bokeh(layout)

        handles_different_array_sizes = {
            "days": pd.Series(days),
            "weeks": pd.Series(weeks),
            "months": pd.Series(months),
            "daily_counts": pd.Series(daily_counts),
            "weekly_counts": pd.Series(weekly_counts),
            "monthly_counts": pd.Series(monthly_counts),
            "commits": pd.Series(commit),
            "links": pd.Series(link),
        }

        return PlotResult(plot=pane, data=pd.DataFrame(handles_different_array_sizes))

    def _make_bar_fig(self, x, counts, title, color):
        src = ColumnDataSource(dict(x=list(range(len(x))), label=x, count=counts))
        p = figure(
            title=title,
            x_range=(-0.5, max(0, len(x) - 0.5)),
            tools="hover,pan,wheel_zoom,reset,save",
            sizing_mode="stretch_width",
            height=int(self.get_chart_height() / 3),
        )
        p.vbar(x="x", top="count", width=0.9, color=color, source=src)
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
        p.xaxis.major_label_overrides = {i: str(v) for i, v in enumerate(x)}
        p.xaxis.major_label_orientation = 0.785  # 45 degrees
        p.yaxis.axis_label = "Deployments"
        return p
