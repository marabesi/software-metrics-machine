import holoviews as hv
from software_metrics_machine.core.infrastructure.base_viewer import BaseViewer
from software_metrics_machine.core.infrastructure.pandas import pd
from typing import Iterable, Callable


class BarchartWithLines(BaseViewer):

    def build_barchart_with_lines(
        self,
        data: Iterable[dict],
        x: str,
        y: str,
        title: str | None = None,
        height: int | None = None,
        xrotation: int = 45,
        label_generator: Callable[[list[dict], str, str], hv.Labels] | None = None,
        vlines: list | None = None,
        vline_opts: dict | None = None,
        extra_labels: list[dict] | None = None,
        tools: list[str] | None = None,
    ):
        df = pd.DataFrame(list(data))
        if df.empty:
            return hv.Text(0.5, 0.5, "No data available")

        # ensure types
        if x in df.columns:
            df[x] = pd.to_datetime(df[x])

        opts_kwargs = dict(title=title or "", height=height or 400, xrotation=xrotation)
        if tools:
            # pass tools (e.g. ['hover']) through to the hv elements so they get wired to Bokeh
            opts_kwargs["tools"] = tools

        curve = hv.Curve(df, x, y).opts(**opts_kwargs)
        # hv.Points expects two kdims for 2D points: pass them as a list
        points = hv.Points(df, [x, y]).opts(**({"tools": tools} if tools else {}))

        labels = None
        if label_generator is not None:
            labels = label_generator(df.to_dict(orient="records"), x, y)

        overlay = curve * points * labels if labels is not None else curve * points

        # add vlines
        if vlines:
            vline_objs = []
            opts = vline_opts or {
                "color": "#CCCCCC",
                "line_dash": "dashed",
                "line_width": 1,
            }
            for v in vlines:
                vline_objs.append(hv.VLine(pd.to_datetime(v)).opts(**opts))
            overlay = overlay * hv.Overlay(vline_objs)

        # add extra labels
        if extra_labels:
            extra_hv = hv.Labels(extra_labels, [x, "y"], "text").opts(
                text_font_size="8pt"
            )
            overlay = overlay * extra_hv

        # ensure tools applied to the overall overlay as well
        if tools:
            overlay = overlay.opts(tools=tools)

        return overlay
