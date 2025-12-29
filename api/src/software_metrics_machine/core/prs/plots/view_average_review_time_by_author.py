from software_metrics_machine.core.infrastructure.pandas import pd

from software_metrics_machine.core.infrastructure.base_viewer import (
    BaseViewer,
    PlotResult,
)
from software_metrics_machine.apps.components.barchart_stacked import (
    BarchartStacked,
)
from software_metrics_machine.core.prs.pr_types import PRDetails, PRFilters
from software_metrics_machine.core.prs.prs_repository import PrsRepository
from collections import defaultdict
from typing import List, Tuple
from datetime import datetime


class ViewAverageReviewTimeByAuthor(BaseViewer):

    def __init__(self, repository: PrsRepository):
        self.barchart = BarchartStacked(repository=repository)
        self.repository: PrsRepository = repository

    def plot_average_open_time(
        self,
        title: str,
        top: int = 10,
        labels: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
        authors: str | None = None,
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
        pairs = self.repository.prs_with_filters(filters)

        if labels:
            labels_strip = [s.strip() for s in labels.split(",") if s.strip()]
            pairs = self.repository.filter_prs_by_labels(pairs, labels_strip)

        pairs = self.__average_open_time_by_author(pairs, top)  # type: ignore

        if len(pairs) == 0:
            pairs = [("No PRs to plot after filtering", 0)]  # type: ignore

        zip_authors, avgs = zip(*pairs)

        data: List[dict] = []
        zips = zip(zip_authors, avgs)
        for name, val in zips:
            data.append({"author": name, "avg_days": val})

        title = title or "Average Review Time By Author"

        chart = self.barchart.build_barchart(
            data,
            x="author",
            y="avg_days",
            stacked=False,
            height=super().get_chart_height(),
            title=title,
            xrotation=0,
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
        sums: dict[str, float] = defaultdict(float)
        counts: dict[str, int] = defaultdict(int)
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
