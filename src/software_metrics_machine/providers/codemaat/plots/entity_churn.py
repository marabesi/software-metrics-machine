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


class EntityChurnViewer(BaseViewer, Viewable):

    def __init__(self, repository: CodemaatRepository):
        self.repository = repository

    def render(
        self,
        top_n: int = 30,
        ignore_files: str | None = None,
        out_file: str | None = None,
        include_only: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> PlotResult:
        df = self.repository.get_entity_churn(
            ignore_files=ignore_files, filters={"include_only": include_only}
        )

        if df is None or df.empty:
            print("No entity churn data available to plot")
            return PlotResult(
                plot=hv.Text(0.5, 0.5, "No entity churn data available"),
                data=pd.DataFrame(),
            )

        # default ordering: by total churn (added + deleted) descending
        df["total_churn"] = df.get("added", 0) + df.get("deleted", 0)

        # apply top-N filter if provided on the viewer instance
        try:
            top_n_int = int(top_n) if top_n is not None else None
        except Exception:
            top_n_int = None
        if top_n_int and top_n_int > 0:
            df = df.sort_values(by="total_churn", ascending=False).head(top_n_int)

        df = self.repository.apply_ignore_file_patterns(df, ignore_files)

        # Ensure columns exist
        if "entity" not in df:
            df["entity"] = []
        if "short_entity" not in df:
            df["short_entity"] = []
        if "added" not in df:
            df["added"] = 0
        if "deleted" not in df:
            df["deleted"] = 0

        # Prepare data for stacked bars
        data = []
        for _, row in df.iterrows():
            data.append(
                {
                    "entity": row.get("entity"),
                    "short_entity": row.get("short_entity"),
                    "type": "Added",
                    "value": row.get("added", 0),
                }
            )
            data.append(
                {
                    "entity": row.get("entity"),
                    "short_entity": row.get("short_entity"),
                    "type": "Deleted",
                    "value": row.get("deleted", 0),
                }
            )

        chart = build_barchart(
            data,
            x="short_entity",
            y="value",
            group="type",
            stacked=True,
            height=super().get_chart_height(),
            title="Code Entity Churn: Lines Added and Deleted",
            xrotation=45,
            label_generator=super().build_labels_above_bars,
            out_file=out_file,
            tools=super().get_tools(),
            color=super().get_color(),
        )

        return PlotResult(plot=chart, data=df)
