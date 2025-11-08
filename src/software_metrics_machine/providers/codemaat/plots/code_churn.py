import holoviews as hv
import pandas as pd

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
    ) -> PlotResult:
        df = self.repository.get_code_churn(
            {"start_date": start_date, "end_date": end_date}
        )

        # Normalize dataframe columns
        if df is None or df.empty:
            print("No code churn data available to plot")
            # Return an informative placeholder (build_barchart will also handle empty data)
            plot = hv.Text(0.5, 0.5, "No code churn data available")
            return PlotResult(plot=plot, data=pd.DataFrame([]))

        if "date" not in df:
            df["date"] = []
        if "added" not in df:
            df["added"] = 0
        if "deleted" not in df:
            df["deleted"] = 0

        # Prepare data for a stacked bar chart: one row per (date, type)
        data = []
        for _, row in df.iterrows():
            data.append(
                {"date": row.get("date"), "type": "Added", "value": row.get("added", 0)}
            )
            data.append(
                {
                    "date": row.get("date"),
                    "type": "Deleted",
                    "value": row.get("deleted", 0),
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

        return PlotResult(plot=chart, data=pd.DataFrame(data))
