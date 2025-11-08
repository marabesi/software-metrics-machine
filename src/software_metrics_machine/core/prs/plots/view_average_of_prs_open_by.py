import pandas as pd
from datetime import datetime, date, timedelta

from software_metrics_machine.core.infrastructure.base_viewer import (
    BaseViewer,
    PlotResult,
)
from software_metrics_machine.core.prs.prs_repository import PrsRepository
from software_metrics_machine.apps.dashboard.components.barchart_with_lines import (
    build_barchart_with_lines,
)
import holoviews as hv

hv.extension("bokeh")


class ViewAverageOfPrsOpenBy(BaseViewer):
    def __init__(self, repository: PrsRepository):
        self.repository = repository

    def main(
        self,
        out_file: str | None = None,
        author: str | None = None,
        authors: str | None = None,
        labels: str | None = None,
        aggregate_by: str = "week",
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> PlotResult:
        prs = self.repository.all_prs

        prs = self.repository.prs_with_filters(
            {"start_date": start_date, "end_date": end_date, "authors": authors}
        )
        print(f"Filtered PRs count: {len(prs)}")

        if aggregate_by == "week":
            x_vals, y_vals = self.repository.average_by_week(
                author=author, labels=labels, prs=prs
            )
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
            # xlabel = "Week"
        else:
            x_vals, y_vals = self.repository.average_by_month(
                author=author, labels=labels, prs=prs
            )
            title = "Average PR Open Days by Month"
            # xlabel = "Month"

        # prepare x/y
        if aggregate_by == "week":
            x = [pd.to_datetime(dt) for dt in week_dates]
            # compute month_starts for vlines and month labels
            start = x[0].date().replace(day=1) if x else None
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
        else:
            x = [pd.to_datetime(v) for v in x_vals]
            vlines = None
            extra_labels = None

        y = y_vals

        data = [{"x": xi, "y": yi} for xi, yi in zip(x, y)]

        chart = build_barchart_with_lines(
            data,
            x="x",
            y="y",
            title=title,
            height=super().get_chart_height(),
            xrotation=45,
            label_generator=super().build_labels_above_bars,
            vlines=vlines,
            extra_labels=extra_labels,
            out_file=out_file,
            tools=super().get_tools(),
        )

        df = pd.DataFrame({"x": x, "y": y})
        return PlotResult(plot=chart, data=df)
