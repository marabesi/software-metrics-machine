from software_metrics_machine.core.infrastructure.pandas import pd
import squarify

from bokeh.plotting import figure
from bokeh.models import ColumnDataSource, HoverTool
from bokeh.transform import linear_cmap

from software_metrics_machine.core.infrastructure.base_viewer import (
    BaseViewer,
    PlotResult,
)
from software_metrics_machine.providers.codemaat.codemaat_repository import (
    CodemaatRepository,
)


class EntityEffortViewer(BaseViewer):
    def __init__(self, repository: CodemaatRepository):
        self.repository: CodemaatRepository = repository

    def render_treemap(
        self,
        top_n: int | None = 30,
        ignore_files: str | None = None,
        include_only: str | None = None,
    ) -> PlotResult:
        repo: CodemaatRepository = self.repository
        df = repo.get_entity_effort(filters={"include_only": include_only})

        if df is None or df.empty:
            p = figure(width=400, height=150, toolbar_location=None)
            p.text(x=[0], y=[0], text=["No entity effort data available"])
            return PlotResult(plot=p, data=pd.DataFrame())

        df = repo.apply_ignore_file_patterns(df, ignore_files)

        effort_per_entity = df.groupby("entity")["total-revs"].max().sort_values()

        if top_n and len(effort_per_entity) > top_n:
            effort_per_entity = effort_per_entity[-top_n:]

        entities = list(effort_per_entity.index)
        values = list(map(float, effort_per_entity.values))

        if not values or sum(values) == 0:
            p = figure(width=400, height=150, toolbar_location=None)
            p.text(x=[0], y=[0], text=["No entity effort data available"])
            return PlotResult(plot=p, data=effort_per_entity.reset_index())

        # Use squarify to compute rectangle positions in a normalized 0..100 box
        normed = squarify.normalize_sizes(values, 100, 100)
        rects = squarify.squarify(normed, 0, 0, 100, 100)

        rows = []
        labels: list[dict] = []
        for r, ent, val in zip(rects, entities, values):
            left = r["x"]
            bottom = r["y"]
            right = r["x"] + r["dx"]
            top = r["y"] + r["dy"]
            rows.append(
                {
                    "left": left,
                    "right": right,
                    "bottom": bottom,
                    "top": top,
                    "entity": ent,
                    "value": val,
                }
            )
            labels.append(
                {
                    "x": (left + right) / 2,
                    "y": (bottom + top) / 2,
                    "text": f"{ent}\n{int(val)}",
                }
            )

        df_rects = pd.DataFrame(rows)

        # Convert rect coords (left, bottom, right, top) into centers and sizes for Bokeh
        df_rects["x"] = df_rects["left"] + (df_rects["right"] - df_rects["left"]) / 2
        df_rects["y"] = df_rects["bottom"] + (df_rects["top"] - df_rects["bottom"]) / 2
        df_rects["dx"] = df_rects["right"] - df_rects["left"]
        df_rects["dy"] = df_rects["top"] - df_rects["bottom"]

        # Build a Bokeh figure that stretches to the available width and matches other chart heights
        h = super().get_chart_height() or 400
        p = figure(
            sizing_mode="stretch_width",
            height=h,
            toolbar_location="right",
        )
        # visual cleanup
        p.xaxis.visible = False
        p.yaxis.visible = False
        p.grid.grid_line_color = None

        # Color mapping by value
        low = float(df_rects["value"].min())
        high = float(df_rects["value"].max())
        mapper = linear_cmap(
            field_name="value",
            palette=super().get_palette(rows)["colors"],
            low=low,
            high=high,
        )

        src = ColumnDataSource(df_rects)

        # Draw rectangles (using center x/y and widths/heights) and capture the renderer
        rects = p.rect(
            x="x",
            y="y",
            width="dx",
            height="dy",
            source=src,
            line_color="white",
            fill_color=mapper,
            fill_alpha=0.8,
        )

        # Add centered labels (entity name and integer value)
        centered_labels = [
            f"{r['entity']}\n{int(r['value'])}" for _, r in df_rects.iterrows()
        ]
        src.add(centered_labels, "label")
        # Basic label placement; for small rectangles text may overlap — acceptable fallback
        p.text(
            x="x",
            y="y",
            text="label",
            source=src,
            text_font_size="7pt",
            text_align="center",
            text_baseline="middle",
            text_color="white",
        )

        # Add a HoverTool bound to the rectangles so labels/tooltips show on hover
        hover = HoverTool(
            tooltips=[("entity", "@entity"), ("value", "@value")],
            renderers=[rects],
            mode="mouse",
        )
        p.add_tools(hover)

        # Return the Bokeh figure
        return PlotResult(plot=p, data=effort_per_entity.reset_index())
