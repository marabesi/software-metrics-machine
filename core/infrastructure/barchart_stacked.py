import holoviews as hv
import pandas as pd
from typing import Callable, Iterable

hv.extension("bokeh")


def build_barchart(
    data: Iterable[dict],
    x: str,
    y: str,
    group: str | None = None,
    stacked: bool = False,
    height: int | None = None,
    title: str | None = None,
    xrotation: int = 45,
    label_generator: Callable[[list[dict], str, str], hv.Labels] | None = None,
    out_file: str | None = None,
    tools: list[str] | None = None,
    color: str | None = None,
):
    """Build a Holoviews Bar chart (stacked or not) and optionally overlay labels.

    - data: iterable of dicts containing x, y and optional group keys
    - x: x axis key
    - y: y axis key
    - group: optional grouping key for stacked bars
    - stacked: True to produce stacked bars (requires group)
    - label_generator: optional callable that returns hv.Labels for given data
    - out_file: optional path to save the chart (hv.save)

    Returns: hv.Overlay or hv.Element (chart with optional labels)
    """

    df = pd.DataFrame(list(data))
    if df.empty:
        # return an empty placeholder so callers can safely render
        return hv.Text(0.5, 0.5, "No data available")

    # Hook to remove borders around bars by modifying the underlying Bokeh glyphs
    def _remove_bar_borders(plot, element):
        try:
            renderers = getattr(plot.state, "renderers", [])
            for r in renderers:
                glyph = getattr(r, "glyph", None)
                if glyph is not None:
                    # bokeh glyphs use line_color for borders
                    if hasattr(glyph, "line_color"):
                        glyph.line_color = None
        except Exception:
            # don't fail plotting if hook can't run
            pass

    if group and stacked:
        bars = hv.Bars(df, [x, group], y).opts(
            stacked=True,
            legend_position="right",
            height=height or 400,
            xrotation=xrotation,
            title=title or "",
            hooks=[_remove_bar_borders],
            tools=tools,
        )
    else:
        bars = hv.Bars(df, x, y).opts(
            height=height or 400,
            xrotation=xrotation,
            title=title or "",
            hooks=[_remove_bar_borders],
            tools=tools,
            color=color,
        )

    labels = None
    if label_generator is not None:
        # label_generator should accept (data_list, x_key, y_key) and return hv.Labels
        labels = label_generator(df.to_dict(orient="records"), x, y)

    chart = bars * labels if labels is not None else bars

    if out_file:
        try:
            hv.save(chart, out_file)
        except Exception:
            pass

    return chart
