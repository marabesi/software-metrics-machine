import matplotlib.pyplot as plt

from core.infrastructure.base_viewer import BaseViewer
from core.infrastructure.viewable import Viewable
from providers.codemaat.codemaat_repository import CodemaatRepository


class CodeChurnViewer(BaseViewer, Viewable):

    def __init__(self, repository: CodemaatRepository):
        self.repository = repository

    def render(
        self,
        out_file: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> None:
        df = self.repository.get_code_churn(
            {"start_date": start_date, "end_date": end_date}
        )

        if df.empty:
            print("No code churn data available to plot")

        if "date" not in df or "added" not in df or "deleted" not in df:
            df["date"] = []
            df["added"] = []
            df["deleted"] = []

        dates = df["date"]
        added = df["added"]
        deleted = df["deleted"]

        fig, ax = plt.subplots(figsize=super().get_fig_size())
        ax.bar(dates, added, label="Added", color="tab:blue")
        ax.bar(dates, deleted, bottom=added, label="Deleted", color="tab:red")

        ax.set_xlabel("Date")
        ax.set_ylabel("Lines of Code")
        ax.set_title("Code Churn: Lines Added and Deleted per Date")
        ax.legend()
        plt.xticks(rotation=45, ha="right")

        return super().output(plt, fig, out_file=out_file, repository=self.repository)
