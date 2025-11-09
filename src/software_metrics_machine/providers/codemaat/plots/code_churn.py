from typing import List
import holoviews as hv

from software_metrics_machine.core.code.code_churn_types import CodeChurn
from software_metrics_machine.core.infrastructure.base_viewer import (
    BaseViewer,
    PlotResult,
)
from software_metrics_machine.core.infrastructure.viewable import Viewable
from software_metrics_machine.apps.dashboard.components.barchart_stacked import (
    build_barchart,
)
from software_metrics_machine.providers.codemaat.codemaat_repository import (
    CodemaatRepository,
)

hv.extension("bokeh")


class CodeChurnViewer(BaseViewer, Viewable):

    def __init__(self, repository: CodemaatRepository):
        self.repository = repository

    def render(
        self,
        out_file: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> PlotResult[List[CodeChurn]]:
        code_churn_result = self.repository.get_code_churn(
            {"start_date": start_date, "end_date": end_date}
        )

        if len(code_churn_result) == 0:
            print("No code churn data available to plot")
            plot = hv.Text(0.5, 0.5, "No code churn data available")
            return PlotResult(plot=plot, data=[])

        data = []
        for row in code_churn_result:
            data.append({"date": row["date"], "type": "Added", "value": row["added"]})
            data.append(
                {
                    "date": row["date"],
                    "type": "Deleted",
                    "value": row["deleted"],
                }
            )

        chart = build_barchart(
            data,
            x="date",
            y="value",
            group="type",
            stacked=True,
            height=super().get_chart_height(),
            title="Code Churn: Lines Added and Deleted per Date",
            xrotation=45,
            label_generator=super().build_labels_above_bars,
            out_file=out_file,
            tools=super().get_tools(),
            color=super().get_color(),
        )

        return PlotResult(plot=chart, data=data)
