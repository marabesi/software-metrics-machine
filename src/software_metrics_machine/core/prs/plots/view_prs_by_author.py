from collections import Counter
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
from typing import List, Tuple


class ViewPrsByAuthor(BaseViewer):
    def __init__(self, repository: PrsRepository):
        self.barchart = BarchartStacked(repository=repository)
        self.repository: PrsRepository = repository

    def plot_top_authors(
        self,
        title: str,
        top: int = 10,
        labels: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
        raw_filters: str | None = None,
    ) -> PlotResult:
        filters = {"start_date": start_date, "end_date": end_date}
        filters = {**filters, **self.repository.parse_raw_filters(raw_filters)}
        prs = self.repository.prs_with_filters(PRFilters(**filters))  # type: ignore

        if labels:
            labels_list = [s.strip() for s in labels.split(",") if s.strip()]
            prs = self.repository.filter_prs_by_labels(prs, labels_list)

        top_authors = self.top_authors(prs, top)

        if len(top_authors) == 0:
            top_authors = [("No PRs to plot after filtering", 0)]

        authors, counts = zip(*top_authors)

        data = []
        for name, cnt in zip(authors, counts):
            data.append({"author": name, "count": cnt})

        chart = self.barchart.build_barchart(
            data,
            x="author",
            y="count",
            stacked=False,
            height=super().get_chart_height(),
            title=title,
            xrotation=0,
            tools=super().get_tools(),
            color=super().get_color(),
        )

        df = (
            pd.DataFrame(top_authors, columns=["author", "count"])
            if top_authors
            else pd.DataFrame()
        )
        return PlotResult(plot=chart, data=df)

    def top_authors(self, prs: List[PRDetails], top: int) -> List[Tuple[str, int]]:
        counts: dict[str, int] = Counter()
        for pr in prs:
            user = pr.user
            login = user.login
            counts[login] += 1
        return counts.most_common(top)  # type: ignore[attr-defined]
