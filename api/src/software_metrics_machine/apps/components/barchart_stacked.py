import holoviews as hv
from bokeh.models import HoverTool
from software_metrics_machine.core.infrastructure.base_viewer import BaseViewer
from software_metrics_machine.core.infrastructure.pandas import pd
from typing import Iterable


class BarchartStacked(BaseViewer):

    def build_barchart(
        self,
        data: Iterable[dict],
        x: str,
        y: str | list[str],
        group: str | None = None,
        stacked: bool = False,
        height: int | None = None,
        title: str | None = None,
        xrotation: int = 45,
        tools: list[str] | None = None,
        color: str | None = None,
    ):
        df = pd.DataFrame(list(data))
        if df.empty:
            return hv.Text(0.5, 0.5, "No data available")

        def _remove_bar_borders(plot, element):
            renderers = getattr(plot.state, "renderers", [])
            for r in renderers:
                glyph = getattr(r, "glyph", None)
                if glyph is not None:
                    # bokeh glyphs use line_color for borders
                    if hasattr(glyph, "line_color"):
                        glyph.line_color = None

        desired_hover = []

        for c in df.columns:
            desired_hover.append((str(c), f"@{c}"))

        hover = HoverTool(tooltips=desired_hover)

        if group and stacked:
            bars = hv.Bars(df, [x, group], y).opts(
                stacked=True,
                legend_position="right",
                height=height or 400,
                xrotation=xrotation,
                title=title or "",
                hooks=[_remove_bar_borders],
                tools=[hover],
                cmap=super().get_palette(df.all())["colors"],
            )
        else:
            bars = hv.Bars(df, x, y).opts(
                height=height or 400,
                xrotation=xrotation,
                title=title or "",
                hooks=[_remove_bar_borders],
                tools=[hover],
                color=color,
                cmap=super().get_palette(df.all())["colors"],
            )

        fig = hv.render(bars, backend="bokeh")
        fig.height = height
        fig.sizing_mode = "stretch_width"
        return fig
