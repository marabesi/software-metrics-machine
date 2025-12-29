from software_metrics_machine.core.infrastructure.pandas import pd
import holoviews as hv

from software_metrics_machine.core.infrastructure.base_viewer import (
    BaseViewer,
    PlotResult,
)
from software_metrics_machine.apps.components.barchart_stacked import (
    BarchartStacked,
)
from software_metrics_machine.core.prs.pr_types import PRFilters
from software_metrics_machine.core.prs.prs_repository import PrsRepository


class ViewOpenPrsThroughTime(BaseViewer):
    def __init__(self, repository: PrsRepository):
        self.barchart = BarchartStacked(repository=repository)
        self.repository: PrsRepository = repository

    def main(
        self,
        title: str,
        start_date: str | None = None,
        end_date: str | None = None,
        authors: str | None = None,
        raw_filters: str | None = None,
    ) -> PlotResult:
        filters = PRFilters(
            **{"start_date": start_date, "end_date": end_date, "authors": authors}
        )
        # merge parsed raw filters if provided
        parsed = self.repository.parse_raw_filters(raw_filters)
        filters = {**filters, **parsed}
        prs = self.repository.prs_with_filters(filters)

        if not prs:
            empty = hv.Text(0, 0, "No PRs to plot for prs through time").opts(
                height=super().get_chart_height()
            )
            return PlotResult(
                plot=empty, data="No data available for the given period."
            )

        timeline: dict[str, dict] = {}

        for pr in prs:
            created_at = pr.created_at[:10]
            closed_at = pr.closed_at

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
        chart = self.barchart.build_barchart(
            rows,
            x="date",
            y="count",
            group="kind",
            stacked=True,
            height=super().get_chart_height(),
            title=title,
            xrotation=45,
            tools=super().get_tools(),
            color=super().get_color(),
        )

        df = pd.DataFrame(rows)

        return PlotResult(plot=chart, data=df)
