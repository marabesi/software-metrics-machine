import matplotlib.pyplot as plt

from infrastructure.base_viewer import MatplotViewer
from infrastructure.viewable import Viewable
from providers.codemaat.codemaat_repository import CodemaatRepository


class EntityChurnViewer(MatplotViewer, Viewable):
    def render(
        self,
        repo: CodemaatRepository,
        top_n: int = 30,
        ignore_files: str | None = None,
        out_file: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> None:
        df = repo.get_entity_churn()

        if df.empty:
            print("No entity churn data available to plot")
            return None

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

        fig, ax = plt.subplots(figsize=super().get_fig_size())
        ax.bar(dates, added, label="Added", color="tab:blue")
        ax.bar(dates, deleted, bottom=added, label="Deleted", color="tab:red")

        ax.set_xlabel("Entity (File)")
        ax.set_ylabel("Lines of Code")
        ax.set_title("Code Entity Churn: Lines Added and Deleted")
        ax.legend()
        plt.xticks(rotation=45, ha="right")
        plt.tight_layout()

        return super().output(plt, fig, out_file=out_file, repository=repo)
