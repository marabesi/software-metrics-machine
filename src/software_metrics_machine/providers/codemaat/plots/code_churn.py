import holoviews as hv

from software_metrics_machine.core.code.code_churn_types import CodeChurnFilters
from software_metrics_machine.core.infrastructure.base_viewer import (
    BaseViewer,
    PlotResult,
)
from software_metrics_machine.core.infrastructure.viewable import Viewable
from software_metrics_machine.apps.components.barchart_stacked import (
    BarchartStacked,
)
from software_metrics_machine.providers.codemaat.codemaat_repository import (
    CodemaatRepository,
)


class CodeChurnViewer(BaseViewer, Viewable):

    def __init__(self, repository: CodemaatRepository):
        self.barchart = BarchartStacked(repository=repository)
        self.repository: CodemaatRepository = repository

    def render(
        self,
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> PlotResult:
        code_churn_result = self.repository.get_code_churn(
            CodeChurnFilters(**{"start_date": start_date, "end_date": end_date})
        )

        if len(code_churn_result) == 0:
            print("No code churn data available to plot")
            plot = hv.Text(0.5, 0.5, "No code churn data available")
            return PlotResult(plot=plot, data=[])

        data = []
        for row in code_churn_result:
            data.append({"date": row.date, "type": "Added", "value": row.added})
            data.append({"date": row.date, "type": "Deleted", "value": row.deleted})

        chart = self.barchart.build_barchart(
            data,
            x="date",
            y="value",
            group="type",
            stacked=True,
            height=super().get_chart_height(),
            title="Code Churn: Lines Added and Deleted per Date",
            xrotation=45,
            tools=super().get_tools(),
            color=super().get_color(),
        )

        return PlotResult(plot=chart, data=data)
