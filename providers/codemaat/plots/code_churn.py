import matplotlib.pyplot as plt

from infrastructure.base_viewer import MatplotViewer
from infrastructure.viewable import Viewable
from providers.codemaat.codemaat_repository import CodemaatRepository


class CodeChurnViewer(MatplotViewer, Viewable):
    def render(
        self,
        repository: CodemaatRepository,
        out_file: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> None:
        df = repository.get_code_churn()

        dates = df["date"]
        added = df["added"]
        deleted = df["deleted"]

        fig, ax = plt.subplots(figsize=(12, 6))
        ax.bar(dates, added, label="Added", color="tab:blue")
        ax.bar(dates, deleted, bottom=added, label="Deleted", color="tab:red")

        ax.set_xlabel("Date")
        ax.set_ylabel("Lines of Code")
        ax.set_title("Code Churn: Lines Added and Deleted per Date")
        ax.legend()
        plt.xticks(rotation=45, ha="right")

        return super().output(plt, fig, out_file=out_file)
