import holoviews as hv
from software_metrics_machine.core.infrastructure.pandas import pd

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


class EntityChurnViewer(BaseViewer, Viewable):

    def __init__(self, repository: CodemaatRepository):
        self.barchart = BarchartStacked(repository=repository)
        self.repository: CodemaatRepository = repository

    def render(
        self,
        top_n: int = 30,
        ignore_files: str | None = None,
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
        if "entity_short" not in df:
            df["entity_short"] = []
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
                    "entity_short": row.get("entity_short"),
                    "type": "Added",
                    "value": row.get("added", 0),
                }
            )
            data.append(
                {
                    "entity": row.get("entity"),
                    "entity_short": row.get("entity_short"),
                    "type": "Deleted",
                    "value": row.get("deleted", 0),
                }
            )

        chart = self.barchart.build_barchart(
            data,
            x="entity_short",
            y=["value", "entity"],
            group="type",
            stacked=True,
            height=super().get_chart_height(),
            title="Code Entity Churn: Lines Added and Deleted",
            xrotation=45,
            tools=super().get_tools(),
            color=super().get_color(),
        )

        return PlotResult(plot=chart, data=df)
