import os
from typing import List, NamedTuple

import pandas as pd
from core.infrastructure.file_system_base_repository import FileSystemBaseRepository
from core.infrastructure.configuration.configuration import Configuration
from matplotlib.figure import Figure
import panel as pn


class PlotResult(NamedTuple):
    matplotlib: Figure
    data: pd.DataFrame


class BaseViewer:

    def __init__(self, repository: FileSystemBaseRepository) -> None:
        self.repository = repository

    def get_chart_width(self) -> None | int:
        return None

    def get_chart_height(self):
        return 500

    def get_fig_size(self):
        return (10, 4)

    def get_tools(self) -> List[str]:
        return []

    def get_color(self) -> str:
        return "#4c78a8"

    def get_font_size(self) -> str:
        return "8pt"

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
