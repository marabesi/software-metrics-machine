import os
from infrastructure.configuration import Configuration
from matplotlib.figure import Figure


class MatplotViewer:

    def output(self, plt, fig: Figure, out_file):
        if out_file:
            cfg = Configuration()
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

            fig.savefig(save_path, dpi=150)
            print(f"Saved plot to {save_path}")
            plt.close(fig)
        else:
            fig.set_size_inches(8, 4)
            return fig
            plt.show()

    def __ensure_png(self, path: str) -> str:
        return path if path.lower().endswith(".png") else f"{path}.png"
