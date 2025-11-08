from collections import Counter
import pandas as pd

from software_metrics_machine.core.infrastructure.base_viewer import (
    BaseViewer,
    PlotResult,
)
from software_metrics_machine.apps.dashboard.components.barchart_stacked import (
    build_barchart,
)
from software_metrics_machine.core.prs.prs_repository import PrsRepository
from typing import List, Tuple


class ViewPrsByAuthor(BaseViewer):
    def __init__(self, repository: PrsRepository):
        self.repository = repository

    def plot_top_authors(
        self,
        title: str,
        top: int = 10,
        labels: List[str] | None = None,
        out_file: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> PlotResult:
        prs = self.repository.prs_with_filters(
            {"start_date": start_date, "end_date": end_date}
        )

        if not prs:
            print("No PRs to plot")

        if labels:
            labels = [s.strip() for s in labels.split(",") if s.strip()]
            prs = self.repository.filter_prs_by_labels(prs, labels)

        print(f"Loaded {len(prs)} PRs after filtering")

        top_authors = self.top_authors(prs, top)

        if len(top_authors) == 0:
            top_authors = [("No PRs to plot after filtering", 0)]
            print("No PRs to plot after filtering")

        authors, counts = zip(*top_authors)

        data = []
        for name, cnt in zip(authors, counts):
            data.append({"author": name, "count": cnt})

        chart = build_barchart(
            data,
            x="author",
            y="count",
            stacked=False,
            height=super().get_chart_height(),
            title=title,
            xrotation=0,
            label_generator=super().build_labels_above_bars,
            out_file=out_file,
            tools=super().get_tools(),
            color=super().get_color(),
        )

        df = (
            pd.DataFrame(top_authors, columns=["author", "count"])
            if top_authors
            else pd.DataFrame()
        )
        return PlotResult(plot=chart, data=df)

    def top_authors(self, prs: List[dict], top: int) -> List[Tuple[str, int]]:
        counts = Counter()
        for pr in prs:
            user = pr.get("user") or {}
            login = user.get("login") if isinstance(user, dict) else str(user)
            if not login:
                login = "<unknown>"
            counts[login] += 1
        return counts.most_common(top)
