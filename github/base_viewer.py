class MatplotViewer:

    def output(self, plt, fig, out_file):
        if out_file:
            save_path = self.__ensure_png(out_file)
            fig.savefig(save_path, dpi=150)
            print(f"Saved plot to {save_path}")
            plt.close(fig)
        else:
            plt.show()

    def __ensure_png(self, path: str) -> str:
        return path if path.lower().endswith('.png') else f"{path}.png"
