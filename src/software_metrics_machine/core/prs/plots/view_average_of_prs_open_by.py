from typing import Any, List

from pandas import Timestamp
from software_metrics_machine.core.infrastructure.pandas import pd
from datetime import datetime, date, timedelta

from software_metrics_machine.core.infrastructure.base_viewer import (
    BaseViewer,
    PlotResult,
)
from software_metrics_machine.core.prs.prs_repository import PrsRepository
from software_metrics_machine.apps.components.barchart_with_lines import (
    BarchartWithLines,
)
from software_metrics_machine.core.prs.pr_types import PRFilters


class ViewAverageOfPrsOpenBy(BaseViewer):
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
                "raw_filters": raw_filters,
            }
        )
        prs = self.repository.prs_with_filters(filters)

        x_vals, y_vals = self.repository.average_by(
            by=aggregate_by, labels=labels, prs=prs
        )

        if aggregate_by == "week":
            # x_vals are ISO week strings like 'YYYY-Www' — convert to a datetime for the week's Monday
            week_dates = []
            for wk in x_vals:
                try:
                    # expect format YYYY-Www
                    parts = wk.split("-W")
                    year = int(parts[0])
                    week = int(parts[1])
                    # fromisocalendar(year, week, 1) -> Monday of that ISO week
                    wd = datetime.fromisocalendar(year, week, 1)
                    week_dates.append(wd)
                except Exception:
                    # fallback: try parsing as ISO date
                    try:
                        wd = datetime.fromisoformat(wk)
                        week_dates.append(wd)
                    except Exception:
                        # if unparsable, skip
                        continue

            title = "Average PR Open Days by Week"
        else:
            title = "Average PR Open Days by Month"

        if aggregate_by == "week":
            x: List[Timestamp] = [pd.to_datetime(dt) for dt in week_dates]
            # compute month_starts for vlines and month labels
            start = x[0].date().replace(day=1) if len(x) > 0 else None
            end_dt = x[-1].date() if x else None
            month_starts = []
            if start and end_dt:
                cur = start
                while cur <= end_dt:
                    month_starts.append(cur)
                    if cur.month == 12:
                        cur = date(cur.year + 1, 1, 1)
                    else:
                        cur = date(cur.year, cur.month + 1, 1)
            vlines = [datetime(ms.year, ms.month, ms.day) for ms in month_starts]
            extra_labels = []
            ylim_top = max(y_vals) if y_vals else 1
            for i in range(len(month_starts)):
                ms = month_starts[i]
                nxt: Any | timedelta
                if i + 1 < len(month_starts):
                    nxt = month_starts[i + 1]
                else:
                    nxt = end_dt + timedelta(days=1)  # type: ignore
                mid = (
                    pd.to_datetime(ms) + (pd.to_datetime(nxt) - pd.to_datetime(ms)) / 2  # type: ignore
                )
                extra_labels.append(
                    {"x": mid, "y": ylim_top * 0.98, "text": ms.strftime("%b %Y")}
                )
        else:
            x = [pd.to_datetime(v) for v in x_vals]
            vlines = None
            extra_labels = None

        y = y_vals

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

        df = pd.DataFrame({"x": x, "y": y})
        return PlotResult(plot=chart, data=df)
