from typing import Generic, List, NamedTuple, TypeVar
from bokeh.palettes import Category20_20

from software_metrics_machine.core.infrastructure.file_system_base_repository import (
    FileSystemBaseRepository,
)
import holoviews as hv

T = TypeVar("T")


class PlotResult(NamedTuple, Generic[T]):
    plot: hv.Element | List[hv.Element]
    data: T


class BaseViewer:

    def __init__(self, repository: FileSystemBaseRepository) -> None:
        self.repository = repository

    def get_chart_width(self) -> None | int:
        return None

    def get_chart_height(self):
        return 600

    def get_fig_size(self):
        return (10, 4)

    def get_tools(self) -> List[str]:
        return ["hover,fullscreen"]

    def get_color(self) -> str:
        return self.repository.configuration.dashboard_color

    def get_font_size(self) -> str:
        return "8pt"

    def get_palette(self, data_points):
        return {
            "name": "Category20_20",
            "colors": Category20_20,
        }
        # if len(data_points) <= 20:
        #     return {
        #         "name": "Category20_20",
        #         "colors": Category20_20,
        #     }
        # return {
        #     "name": "Viridis256",
        #     "colors": Viridis256,
        # }

    def build_labels_above_bars(
        self,
        data: list[dict],
        x_key: str,
        y_key: str,
        text_fmt: str | None = None,
        min_offset: float = 0.1,
        pct_offset: float = 0.02,
    ) -> hv.Labels:
        max_val = max((d.get(y_key, 0) for d in data), default=0)
        offset = max(max_val * pct_offset, min_offset)

        labels_data = []
        for d in data:
            val = d.get(y_key, 0)
            # place label above positive bars, below negative bars
            y = val + offset if val >= 0 else val - offset
            if text_fmt:
                text = text_fmt.format(val)
            else:
                try:
                    text = f"{val:.1f}"
                except Exception:
                    text = str(val)
            labels_data.append({x_key: d.get(x_key), "y": y, "text": text})

        labels = hv.Labels(labels_data, [x_key, "y"], "text").opts(
            text_font_size=self.get_font_size(),
            text_baseline="bottom",
            text_align="center",
            text_color=self.get_color(),
        )
        return labels
