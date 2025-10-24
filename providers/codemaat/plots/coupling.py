import math
from typing import Dict, List

import pandas as pd
from bokeh.plotting import figure
from bokeh.models import (
    ColumnDataSource,
    MultiLine,
    LabelSet,
    HoverTool,
    Circle as BkCircle,
)
from bokeh.palettes import Viridis256, Category20_20

from core.infrastructure.base_viewer import BaseViewer, PlotResult
from core.infrastructure.viewable import Viewable
from providers.codemaat.codemaat_repository import CodemaatRepository


class CouplingViewer(BaseViewer, Viewable):
    def __init__(self, repository: CodemaatRepository):
        self.repository = repository

    def _circular_layout(
        self, nodes: List[str], radius: float = 1.0
    ) -> Dict[str, tuple]:
        """Assign nodes to equally spaced points on a circle."""
        layout: Dict[str, tuple] = {}
        n = len(nodes)
        for i, node in enumerate(nodes):
            angle = 2 * math.pi * i / max(n, 1)
            x = radius * math.cos(angle)
            y = radius * math.sin(angle)
            layout[node] = (x, y)
        return layout

    def render(
        self,
        ignore_files: str | None = None,
        out_file: str | None = None,
        top_n: int = 20,
    ) -> PlotResult:
        df = self.repository.get_coupling(ignore_files=ignore_files)
        if df is None or df.empty:
            print("No coupling data available to plot")
            return PlotResult(plot=None, data=pd.DataFrame())

        # select top N by degree to keep diagram readable
        try:
            top_df = df.nlargest(top_n, "degree")
        except Exception:
            top_df = df

        # Build node list and mapping
        unique_nodes = pd.unique(
            top_df["entity"].tolist() + top_df["coupled"].tolist()
        ).tolist()
        if not unique_nodes:
            return PlotResult(plot=None, data=top_df)

        layout = self._circular_layout(unique_nodes, radius=1.0)

        # Convert edges into multi-line segments (chords)
        xs: List[List[float]] = []
        ys: List[List[float]] = []
        weights: List[float] = []
        sources: List[str] = []
        targets: List[str] = []

        for _, row in top_df.iterrows():
            src = row.get("entity")
            tgt = row.get("coupled")
            if src not in layout or tgt not in layout:
                continue
            x0, y0 = layout[src]
            x1, y1 = layout[tgt]
            # simple chord as straight line between the two nodes
            xs.append([x0, x1])
            ys.append([y0, y1])
            w = float(row.get("degree", 1.0))
            weights.append(w)
            sources.append(src)
            targets.append(tgt)

        if not xs:
            return PlotResult(plot=None, data=top_df)

        # Create data sources for nodes and edges
        node_x = [layout[n][0] for n in unique_nodes]
        node_y = [layout[n][1] for n in unique_nodes]

        # Assign categorical colors to nodes (Category20_20 supports up to 20 distinct colors)
        palette = Category20_20 if len(unique_nodes) <= 20 else Viridis256
        node_colors = [palette[i % len(palette)] for i in range(len(unique_nodes))]
        node_source = ColumnDataSource(
            dict(x=node_x, y=node_y, label=unique_nodes, color=node_colors)
        )

        # Derive per-edge visual properties (color by source node, scale width by weight)
        edge_colors = []
        for src in sources:
            try:
                idx = unique_nodes.index(src)
                edge_colors.append(node_colors[idx])
            except ValueError:
                edge_colors.append("gray")

        # scale line widths based on weights (normalize)
        low = min(weights)
        high = max(weights)
        if high == low:
            line_widths = [2 for _ in weights]
        else:
            line_widths = [1 + 4 * ((w - low) / (high - low)) for w in weights]

        edge_source = ColumnDataSource(
            dict(
                xs=xs,
                ys=ys,
                weight=weights,
                source=sources,
                target=targets,
                edge_color=edge_colors,
                line_width=line_widths,
            )
        )

        p = figure(
            title=f"Top {top_n} Code Coupling Chord Diagram",
            tools="pan,wheel_zoom,reset,save",
            x_axis_type=None,
            y_axis_type=None,
            match_aspect=True,
            sizing_mode="stretch_width",
            height=self.get_chart_height(),
        )
        p.grid.grid_line_color = None

        # Draw chords as MultiLine using edge_source; store renderer to attach hover
        edge_renderer = p.multi_line(
            xs="xs",
            ys="ys",
            line_color="edge_color",
            line_width="line_width",
            source=edge_source,
            line_alpha=0.8,
        )

        # Draw nodes; capture renderer for node hover/select
        node_renderer = p.circle(
            x="x",
            y="y",
            size=14,
            fill_color="color",
            line_color=None,
            source=node_source,
        )

        # Add labels
        labels = LabelSet(
            x="x",
            y="y",
            text="label",
            source=node_source,
            text_align="center",
            text_baseline="middle",
            text_font_size=self.get_font_size(),
        )
        p.add_layout(labels)

        # Hover tools for edges and nodes
        edge_hover = HoverTool(
            renderers=[edge_renderer],
            tooltips=[
                ("source", "@source"),
                ("target", "@target"),
                ("weight", "@weight"),
            ],
        )
        node_hover = HoverTool(renderers=[node_renderer], tooltips=[("file", "@label")])
        p.add_tools(edge_hover, node_hover)

        # Visual feedback on hover/selection
        # increase node radius on hover (use screen units to emulate 'size')
        node_renderer.hover_glyph = BkCircle(
            radius=10, radius_units="screen", fill_color="color", line_color=None
        )
        node_renderer.selection_glyph = BkCircle(
            radius=10, radius_units="screen", fill_color="color", line_color=None
        )

        # increase edge width on hover/selection
        edge_renderer.hover_glyph = MultiLine(line_color="edge_color", line_width=6)
        edge_renderer.selection_glyph = MultiLine(line_color="edge_color", line_width=6)

        return PlotResult(plot=p, data=top_df)
