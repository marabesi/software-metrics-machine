import pandas as pd
import holoviews as hv

from software_metrics_machine.core.infrastructure.base_viewer import (
    BaseViewer,
    PlotResult,
)
from software_metrics_machine.apps.dashboard.components.barchart_stacked import (
    build_barchart,
)
from software_metrics_machine.core.prs.prs_repository import PrsRepository


class ViewOpenPrsThroughTime(BaseViewer):
    def __init__(self, repository: PrsRepository):
        self.repository = repository

    def main(
        self,
        title: str,
        out_file: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
        authors: str | None = None,
    ) -> PlotResult:
        prs = self.repository.prs_with_filters(
            {"start_date": start_date, "end_date": end_date, "authors": authors}
        )

        if not prs:
            print("No PRs to plot for prs through time")
            # return an empty hv.Text so callers can render the message
            empty = hv.Text(0, 0, "No PRs to plot for prs through time").opts(
                height=super().get_chart_height()
            )
            return PlotResult(plot=empty, data=pd.DataFrame())

        timeline: dict[str, dict] = {}

        for pr in prs:
            created_at = pr.get("created_at")[:10]  # Extract date only
            closed_at = pr.get("closed_at")

            if created_at not in timeline:
                timeline[created_at] = {"opened": 0, "closed": 0}

            timeline[created_at]["opened"] += 1

            if closed_at:
                closed_date = closed_at[:10]
                if closed_date not in timeline:
                    timeline[closed_date] = {"opened": 0, "closed": 0}
                timeline[closed_date]["closed"] += 1

        dates = sorted(timeline.keys())

        rows = []
        for d in dates:
            rows.append({"date": d, "kind": "Opened", "count": timeline[d]["opened"]})
            rows.append({"date": d, "kind": "Closed", "count": timeline[d]["closed"]})

        # build a stacked barchart grouped by 'kind'
        chart = build_barchart(
            rows,
            x="date",
            y="count",
            group="kind",
            stacked=True,
            height=super().get_chart_height(),
            title=title,
            xrotation=45,
            label_generator=super().build_labels_above_bars,
            out_file=out_file,
            tools=super().get_tools(),
            color=super().get_color(),
        )

        df = pd.DataFrame(rows)

        return PlotResult(plot=chart, data=df)
