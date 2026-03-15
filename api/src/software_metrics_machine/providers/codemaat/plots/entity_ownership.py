from software_metrics_machine.core.infrastructure.pandas import pd
import holoviews as hv

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


class EntityOnershipViewer(BaseViewer, Viewable):
    def __init__(self, repository: CodemaatRepository):
        self.barchart = BarchartStacked(repository=repository)
        self.repository: CodemaatRepository = repository

    def render(
        self,
        top_n: int = 30,
        ignore_files: str | None = None,
        authors: str | None = None,
        type_churn: str | None = "added",
        include_only: str | None = None,
    ) -> PlotResult:
        repo: CodemaatRepository = self.repository
        df = repo.get_entity_ownership(
            authors.split(",") if authors else [],
            filters={"include_only": include_only},
        )

        if df is None or df.empty:
            print("Found 0 row for entity ownership")
            print("No entity ownership data available to plot")
            return PlotResult(
                plot=hv.Text(0.5, 0.5, "No entity ownership data available"),
                data=pd.DataFrame(),
            )

        df = repo.apply_ignore_file_patterns(df, ignore_files)

        ownership = (
            df.groupby(["entity", "entity_short", "author"])[["added", "deleted"]]
            .sum()
            .reset_index()
        )
        ownership["total"] = ownership["added"] + ownership["deleted"]
        top_entities = (
            ownership.groupby("entity")["total"]
            .sum()
            .sort_values(ascending=False)
            .head(top_n)
            .index
        )
        ownership = ownership[ownership["entity"].isin(top_entities)]

        # Prepare data for build_barchart: one dataset for "added" and one for "deleted"
        data_added = []
        data_deleted = []
        for _, row in ownership.iterrows():
            data_added.append(
                {
                    "entity": row["entity"],
                    "entity_short": row.get("entity_short"),
                    "author": row["author"],
                    "value": row.get("added", 0),
                }
            )
            data_deleted.append(
                {
                    "entity": row["entity"],
                    "entity_short": row.get("entity_short"),
                    "author": row["author"],
                    "value": row.get("deleted", 0),
                }
            )

        # Build stacked bars for added (stacked by author)
        bars_added = self.barchart.build_barchart(
            data_added,
            x="entity_short",
            y=["value", "entity"],
            group="author",
            stacked=True,
            height=super().get_chart_height(),
            title="Entity Ownership: Lines Added per Author",
            xrotation=45,
            tools=super().get_tools(),
            color=super().get_color(),
        )

        # Build stacked bars for deleted and overlay with transparency
        bars_deleted = self.barchart.build_barchart(
            data_deleted,
            x="entity_short",
            y="value",
            group="author",
            stacked=True,
            height=super().get_chart_height(),
            title="Entity Ownership: Lines Deleted per Author",
            xrotation=45,
            tools=super().get_tools(),
            color=super().get_color(),
        )

        if type_churn == "added":
            chart = bars_added
        elif type_churn == "deleted":
            chart = bars_deleted

        try:
            chart = chart.opts(sizing_mode="stretch_width")
        except Exception:
            pass

        return PlotResult(plot=chart, data=ownership)
