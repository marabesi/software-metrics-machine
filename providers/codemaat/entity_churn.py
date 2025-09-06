import argparse
import matplotlib.pyplot as plt

from infrastructure.base_viewer import MatplotViewer
from infrastructure.viewable import Viewable
from codemaat_repository import CodemaatRepository


class EntityChurnViewer(MatplotViewer, Viewable):
    def render(
        self,
        repo: CodemaatRepository,
        top_n: int = 30,
        ignore_files: str | None = None,
        out_file: str | None = None,
    ) -> None:
        df = repo.get_entity_churn()

        # default ordering: by total churn (added + deleted) descending
        df["total_churn"] = df.get("added", 0) + df.get("deleted", 0)

        # apply top-N filter if provided on the viewer instance
        if top_n:
            try:
                top_n = int(top_n)
            except Exception:
                top_n = None
        if top_n and top_n > 0:
            df = df.sort_values(by="total_churn", ascending=False).head(top_n)

        df = repo.apply_ignore_file_patterns(df, ignore_files)

        dates = df["entity"]
        added = df["added"]
        deleted = df["deleted"]

        fig, ax = plt.subplots(figsize=(12, 6))
        ax.bar(dates, added, label="Added", color="tab:blue")
        ax.bar(dates, deleted, bottom=added, label="Deleted", color="tab:red")

        ax.set_xlabel("Entity (File)")
        ax.set_ylabel("Lines of Code")
        ax.set_title("Code Entity Churn: Lines Added and Deleted")
        ax.legend()
        plt.xticks(rotation=45, ha="right")
        plt.tight_layout()

        super().output(plt, fig, out_file=out_file)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Plot coupling graph")
    parser.add_argument(
        "--out-file",
        "-o",
        type=str,
        default=None,
        help="Optional path to save the plot image",
    )
    parser.add_argument(
        "--top",
        type=int,
        default=None,
        help="Optional number of top entities to display (by total churn)",
    )
    parser.add_argument(
        "--ignore-files",
        dest="ignore_files",
        type=str,
        default=None,
        help="Optional comma-separated glob patterns to ignore (e.g. '*.json,**/**/*.png')",
    )
    args = parser.parse_args()
    viewer = EntityChurnViewer()
    df_repo = CodemaatRepository()
    viewer.render(
        df_repo, top_n=args.top, ignore_files=args.ignore_files, out_file=args.out_file
    )
