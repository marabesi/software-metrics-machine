import pandas as pd

from software_metrics_machine.core.infrastructure.base_viewer import (
    BaseViewer,
    PlotResult,
)
from software_metrics_machine.apps.components.barchart_stacked import (
    build_barchart,
)
from software_metrics_machine.core.prs.pr_types import PRDetails
from software_metrics_machine.core.prs.prs_repository import PrsRepository
from collections import defaultdict
from typing import List, Tuple
from datetime import datetime


class ViewAverageReviewTimeByAuthor(BaseViewer):

    def __init__(self, repository: PrsRepository):
        self.repository = repository

    def plot_average_open_time(
        self,
        title: str,
        top: int = 10,
        labels: List[str] | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
        authors: str | None = None,
        raw_filters: str | None = None,
    ) -> PlotResult:
        filters = {
            "start_date": start_date,
            "end_date": end_date,
            "authors": authors,
            "raw_filters": raw_filters,
        }
        pairs = self.repository.prs_with_filters(filters)

        if labels:
            labels = [s.strip() for s in labels.split(",") if s.strip()]
            pairs = self.repository.filter_prs_by_labels(pairs, labels)

        pairs = self.__average_open_time_by_author(pairs, top)

        if len(pairs) == 0:
            pairs = [("No PRs to plot after filtering", 0)]

        authors, avgs = zip(*pairs)

        data = []
        for name, val in zip(authors, avgs):
            data.append({"author": name, "avg_days": val})

        title = title or "Average Review Time By Author"

        chart = build_barchart(
            data,
            x="author",
            y="avg_days",
            stacked=False,
            height=super().get_chart_height(),
            title=title,
            xrotation=0,
            label_generator=super().build_labels_above_bars,
            tools=super().get_tools(),
            color=super().get_color(),
        )

        df = (
            pd.DataFrame(pairs, columns=["author", "avg_days"])
            if pairs
            else pd.DataFrame()
        )
        return PlotResult(plot=chart, data=df)

    def __average_open_time_by_author(
        self, prs: List[PRDetails], top: int
    ) -> List[Tuple[str, float]]:
        sums = defaultdict(float)
        counts = defaultdict(int)
        for pr in prs:
            merged = pr.merged_at
            created = pr.created_at
            if not merged or not created:
                continue
            try:
                dt_created = datetime.fromisoformat(created.replace("Z", "+00:00"))
                dt_merged = datetime.fromisoformat(merged.replace("Z", "+00:00"))
            except Exception:
                print(
                    "Failed to parse dates for PR: ",
                    pr.html_url,
                    created,
                    merged,
                )
                continue
            delta_days = (dt_merged - dt_created).total_seconds() / 86400.0
            login = pr.user.login
            sums[login] += delta_days
            counts[login] += 1

        averages = []
        for login, total in sums.items():
            averages.append((login, total / counts[login]))

        averages.sort(key=lambda x: x[1], reverse=True)
        return averages[:top]
