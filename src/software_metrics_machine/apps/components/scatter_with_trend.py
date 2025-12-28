import holoviews as hv
from software_metrics_machine.core.infrastructure.pandas import pd
from typing import List, Optional, Tuple, Any
from collections.abc import Mapping
from bokeh.plotting import figure
from bokeh.models import ColumnDataSource
from bokeh.transform import factor_cmap, factor_mark
from bokeh.palettes import Category10


class ScatterWithTrend:

    def build_scatter_with_trend(
        self,
        data: List,
        x: str,
        y: str,
        title: Optional[str] = None,
        height: Optional[int] = 300,
        point_size: int = 8,
        point_opts: dict | None = None,
        tools: list[str] | None = None,
        color_map: Optional[str] = "viridis",
        show_colorbar: bool = True,
    ):
        """
        Build a reusable scatter plot (circles) with an optional straight trend line.

        This version normalizes input into a list of rows (dicts) and avoids
        relying on a full DataFrame for plotting. Date/coercion and regression
        still use pandas/numpy internally where helpful.
        """
        rows = self._normalize_to_rows(data, x, y)

        if not rows:
            return self._empty_figure("No data available", height=height)

        # ensure x and y are present in at least one row
        if all((r.get(x) is None or r.get(y) is None) for r in rows):
            return self._empty_figure("No data available", height=height)

        # compute a numeric representation of x to use for coloring (if possible)
        x_series_for_color = pd.Series([r.get(x) for r in rows])
        numeric_x_for_color, _is_dt_color = self._to_numeric_x(x_series_for_color)

        # decide whether to add a color dimension
        color_key = x
        add_color = False
        if numeric_x_for_color.notna().any():
            # if there's variance, add color dimension
            non_na = numeric_x_for_color.dropna()
            if len(non_na) >= 2 and non_na.max() != non_na.min():
                add_color = True

        # attach numeric color values to rows when applicable
        if add_color:
            for i, val in enumerate(numeric_x_for_color):
                try:
                    rows[i][color_key] = float(val) if pd.notna(val) else None
                except Exception:
                    rows[i][color_key] = None

        # prepare points options
        p_opts = {"size": point_size, "alpha": 0.8}
        if point_opts:
            p_opts.update(point_opts)
        # If x is categorical-like (strings with a small number of unique values),
        # produce a Bokeh figure using factor_cmap and factor_mark like the
        # provided snippet. Otherwise fall back to Holoviews Points overlay.
        categorical = False
        try:
            uniq = x_series_for_color.dropna().astype(str).unique()
            categorical = (
                x_series_for_color.dtype == object
                or x_series_for_color.dtype == "string"
                or len(uniq) <= 10
            )
        except Exception:
            categorical = False

        if categorical:
            # Bokeh style: map categories to colors and markers
            factors = sorted(list(x_series_for_color.dropna().astype(str).unique()))
            if not factors:
                return self._empty_figure("No data available", height=height)

            # choose palette length
            palette = (
                Category10[10]
                if len(factors) > 10
                else Category10[max(3, len(factors))]
            )
            MARKERS = [
                "hex",
                "circle_x",
                "triangle",
                "square",
                "diamond",
                "cross",
                "inverted_triangle",
                "asterisk",
            ]

            # build ColumnDataSource
            df_src = pd.DataFrame(rows)
            src = ColumnDataSource(df_src)

            p = figure(
                title=title or "", background_fill_color="#fafafa", height=height
            )
            p.xaxis.axis_label = x
            p.yaxis.axis_label = y

            p.scatter(
                x,
                y,
                source=src,
                legend_field=x,
                fill_alpha=float(point_opts.get("alpha", 0.8)) if point_opts else 0.8,
                size=point_size,
                marker=factor_mark(x, MARKERS, factors),
                color=factor_cmap(x, palette, factors),
            )

            p.legend.location = "top_left"
            p.legend.title = x
            return p

        # Holoviews can plot a list of dicts directly. Provide color as a value
        # dimension (vdims) rather than a third key dimension to avoid 3D geometry.
        if add_color:
            pts = hv.Points(rows, [x, y], vdims=[color_key])
            pts = pts.opts(
                color=color_key,
                cmap=color_map,
                colorbar=show_colorbar,
                **({"tools": tools} if tools else {}),
                **p_opts,
            )
        else:
            pts = hv.Points(rows, [x, y])
            pts = pts.opts(
                color="#1f77b4", **({"tools": tools} if tools else {}), **p_opts
            )

        fig = hv.render(pts, backend="bokeh")
        fig.title.text = title or ""
        fig.height = height
        fig.sizing_mode = "stretch_width"
        return fig

    def _empty_figure(self, message: str, height: Optional[int] = 200):
        """Return a minimal Bokeh figure containing a centered message."""
        p = figure(height=height, toolbar_location=None)
        p.xaxis.visible = False
        p.yaxis.visible = False
        p.xgrid.visible = False
        p.ygrid.visible = False
        p.outline_line_color = None
        p.text(
            x=[0.5],
            y=[0.5],
            text=[message],
            text_align="center",
            text_baseline="middle",
        )
        return p

    def _to_numeric_x(self, series: pd.Series) -> Tuple[pd.Series, bool]:
        """Convert x values to numeric for regression.

        Returns (numeric_series, is_datetime)
        """
        if pd.api.types.is_datetime64_any_dtype(series) or pd.api.types.is_string_dtype(
            series
        ):
            # try parse to datetime
            try:
                dt = pd.to_datetime(series)
                # use timestamps (seconds) for numeric regression
                numeric = dt.map(lambda d: d.timestamp())
                return numeric, True
            except Exception:
                pass
        # fallback: coerce to numeric (may produce NaNs)
        numeric = pd.to_numeric(series, errors="coerce")
        return numeric, False

    def _normalize_to_rows(self, data: Any, x: str, y: str) -> List[dict]:
        """Normalize various input types to a list of dicts with keys x and y.

        Accepts:
        - list of dicts
        - list of pydantic-like objects with .model_dump() or .dict()
        - list of tuples/lists (positional: [x, y, ...])
        - list of objects with attributes named x and y
        - pandas DataFrame (converted to rows)
        """
        rows: List[dict] = []
        if data is None:
            return rows

        if isinstance(data, pd.DataFrame):
            for _, r in data.iterrows():
                rows.append({x: r.get(x), y: r.get(y)})
            return rows

        try:
            iterator = iter(data)
        except TypeError:
            return rows

        for item in iterator:
            if hasattr(item, "model_dump"):
                d = item.model_dump()
                rows.append({x: d.get(x), y: d.get(y)})

            if isinstance(item, Mapping):
                rows.append({x: item.get(x), y: item.get(y)})
                continue

            if isinstance(item, (list, tuple)):
                a = item[0] if len(item) > 0 else None
                b = item[1] if len(item) > 1 else None
                rows.append({x: a, y: b})
                continue

            if hasattr(item, x) and hasattr(item, y):
                rows.append({x: getattr(item, x), y: getattr(item, y)})
                continue

            d = dict(item)
            rows.append({x: d.get(x), y: d.get(y)})

        return rows
