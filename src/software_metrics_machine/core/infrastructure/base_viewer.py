import os
from typing import Generic, List, NamedTuple, TypeVar

from software_metrics_machine.core.infrastructure.file_system_base_repository import (
    FileSystemBaseRepository,
)
from software_metrics_machine.core.infrastructure.configuration.configuration import (
    Configuration,
)
from matplotlib.figure import Figure
import panel as pn
import holoviews as hv

T = TypeVar("T")


class PlotResult(NamedTuple, Generic[T]):
    plot: Figure
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

    def build_labels_above_bars(
        self,
        data: list[dict],
        x_key: str,
        y_key: str,
        text_fmt: str | None = None,
        min_offset: float = 0.1,
        pct_offset: float = 0.02,
    ) -> hv.Labels:
        """Create hv.Labels positioned just above bar tops.

        - data: list of dicts containing x_key and y_key
        - x_key: key used for x coordinate (categorical name)
        - y_key: key used for y coordinate (numeric bar height)
        - text_fmt: optional format string for label, e.g. "{:.1f}"; if None uses "{:.1f}"
        - min_offset: minimum offset in data units
        - pct_offset: percentage of max value to use as offset
        """
        # compute offset based on data magnitude
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

    def output(
        self, plt, fig: Figure, out_file, repository: FileSystemBaseRepository
    ) -> Figure:
        if out_file:
            cfg: Configuration = repository.configuration
            # if out_file is an absolute path, respect it; otherwise join with configured store path
            if os.path.isabs(out_file):
                store_at = out_file
            else:
                store_at = os.path.join(cfg.store_data or "", out_file)

            save_path = self.__ensure_png(store_at)

            # ensure parent directory exists when provided
            parent = os.path.dirname(save_path)
            if parent:
                try:
                    os.makedirs(parent, exist_ok=True)
                except Exception:
                    # if directory creation fails, let fig.savefig raise the appropriate error
                    pass

            fig.savefig(save_path, dpi=900)
            print(f"Saved plot to {save_path}")
            plt.close(fig)
            return fig
        else:
            # return fig
            mpl_pane = pn.pane.Matplotlib(
                fig,
                dpi=144,
                tight=True,
                format="png",
                sizing_mode="stretch_width",
            )
            plt.close(fig)
            return mpl_pane
            # plt.show()

    def __ensure_png(self, path: str) -> str:
        return path if path.lower().endswith(".png") else f"{path}.png"
