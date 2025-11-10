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


class ViewAverageCommentsPerPullRequest(BaseViewer):
    def __init__(self, repository: PrsRepository):
        self.repository = repository

    def _pr_comment_count_before_merge(self, pr: dict) -> int:
        """Count comments present on the PR up to merged_at (or now if not merged).

        PRs and comments in repository are expected to have ISO datetime strings
        in `created_at` fields. We treat any comment with created_at <= merged_at as
        counted for that PR. If merged_at is None, skip the PR (we focus on comments
        before merge).
        """
        merged_at = pr.get("merged_at")
        if not merged_at:
            return 0
        try:
            merged_dt = datetime.fromisoformat(merged_at.replace("Z", "+00:00"))
        except Exception:
            # if unparsable, ignore this PR
            return 0

        comments = pr.get("comments") or []
        count = 0
        for c in comments:
            c_created = c.get("created_at")
            if not c_created:
                continue
            try:
                c_dt = datetime.fromisoformat(c_created.replace("Z", "+00:00"))
            except Exception:
                # skip unparsable
                continue
            if c_dt <= merged_dt:
                count += 1

        return count

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
        prs = self.repository.prs_with_filters(
            {"start_date": start_date, "end_date": end_date, "authors": authors}
        )

        # focus only on merged PRs (we measure comments before merge)
        merged_prs = [pr for pr in prs if pr.get("merged_at")]

        if aggregate_by == "week":
            # repository.average_by_week expects PRs and returns week keys and y-values;
            # we'll compute our own aggregation: group by ISO week of merged_at and
            # average comment counts per PR in each week.
            buckets: dict = {}
            for pr in merged_prs:
                try:
                    merged_dt = datetime.fromisoformat(
                        pr["merged_at"].replace("Z", "+00:00")
                    )
                except Exception:
                    continue
                iso = merged_dt.isocalendar()
                year = iso[0]
                week = iso[1]
                week_key = f"{year}-W{week:02d}"
                cnt = self._pr_comment_count_before_merge(pr)
                buckets.setdefault(week_key, []).append(cnt)

            weeks = sorted(buckets.keys())
            avg_vals = [sum(buckets[w]) / len(buckets[w]) for w in weeks]

            # convert week keys to datetime (Monday of that ISO week)
            week_dates = []
            for wk in weeks:
                try:
                    parts = wk.split("-W")
                    y = int(parts[0])
                    w = int(parts[1])
                    wd = datetime.fromisocalendar(y, w, 1)
                    week_dates.append(wd)
                except Exception:
                    try:
                        wd = datetime.fromisoformat(wk)
                        week_dates.append(wd)
                    except Exception:
                        continue

            x = [pd.to_datetime(dt) for dt in week_dates]
            y = avg_vals

            # compute month vlines/labels like the other view
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
            ylim_top = max(y) if y else 1
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

            title = "Average comments per PR (by merge week)"

        else:
            # aggregate by month using merged_at month
            buckets: dict = {}
            for pr in merged_prs:
                try:
                    merged_dt = datetime.fromisoformat(
                        pr["merged_at"].replace("Z", "+00:00")
                    )
                except Exception:
                    continue
                month_key = merged_dt.strftime("%Y-%m")
                cnt = self._pr_comment_count_before_merge(pr)
                buckets.setdefault(month_key, []).append(cnt)

            months = sorted(buckets.keys())
            avg_vals = [sum(buckets[m]) / len(buckets[m]) for m in months]

            x = [pd.to_datetime(v) for v in months]
            y = avg_vals
            vlines = None
            extra_labels = None
            title = "Average comments per PR (by merge month)"

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
