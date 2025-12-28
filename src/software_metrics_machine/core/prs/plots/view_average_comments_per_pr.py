from software_metrics_machine.core.infrastructure.pandas import pd
from datetime import datetime, date, timedelta

from software_metrics_machine.core.infrastructure.base_viewer import (
    BaseViewer,
    PlotResult,
)
from software_metrics_machine.core.prs.pr_types import PRFilters
from software_metrics_machine.core.prs.prs_repository import PrsRepository
from software_metrics_machine.apps.components.barchart_with_lines import (
    BarchartWithLines,
)


class ViewAverageCommentsPerPullRequest(BaseViewer):
    def __init__(self, repository: PrsRepository):
        self.barchart_with_lines = BarchartWithLines(repository=repository)
        self.repository: PrsRepository = repository

    def main(
        self,
        authors: str | None = None,
        labels: str | None = None,
        aggregate_by: str = "week",
        start_date: str | None = None,
        end_date: str | None = None,
        raw_filters: str | None = None,
    ) -> PlotResult:
        filters = PRFilters(
            **{
                "start_date": start_date,
                "end_date": end_date,
                "authors": authors,
                "labels": labels,
                "raw_filters": raw_filters,
            }
        )

        df = self.repository.average_comments(
            filters=filters,
            aggregate_by=aggregate_by,
        )

        vlines = None
        extra_labels = None
        title = (
            "Average comments per PR (by merge week)"
            if aggregate_by == "week"
            else "Average comments per PR (by merge month)"
        )

        is_empty = len(df["period"]) == 0

        if not is_empty and aggregate_by == "week":
            x = list(df["x"])
            y = list(df["y"])
            start = x[0].date().replace(day=1)
            end_dt = x[-1].date()
            month_starts = []
            cur = start
            while cur <= end_dt:
                month_starts.append(cur)
                if cur.month == 12:
                    cur = date(cur.year + 1, 1, 1)
                else:
                    cur = date(cur.year, cur.month + 1, 1)

            vlines = [datetime(ms.year, ms.month, ms.day) for ms in month_starts]
            ylim_top = max(y) if y else 1
            extra_labels = []
            for i in range(len(month_starts)):
                ms = month_starts[i]
                if i + 1 < len(month_starts):
                    nxt = month_starts[i + 1]
                else:
                    nxt = end_dt + timedelta(days=1)
                mid = (
                    pd.to_datetime(ms) + (pd.to_datetime(nxt) - pd.to_datetime(ms)) / 2
                )
                extra_labels.append(
                    {"x": mid, "y": ylim_top * 0.98, "text": ms.strftime("%b %Y")}
                )

            data = [{"x": xi, "y": yi} for xi, yi in zip(x, y)]
        else:
            if is_empty:
                data = []
            else:
                x = list(df["x"])
                y = list(df["y"])
                data = [{"x": xi, "y": yi} for xi, yi in zip(x, y)]

        chart = self.barchart_with_lines.build_barchart_with_lines(
            data,
            x="x",
            y="y",
            title=title,
            height=super().get_chart_height(),
            xrotation=45,
            label_generator=super().build_labels_above_bars,
            vlines=vlines,
            extra_labels=extra_labels,
            tools=super().get_tools(),
        )

        return PlotResult(plot=chart, data=df)
