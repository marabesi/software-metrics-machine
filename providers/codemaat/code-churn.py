import argparse
import matplotlib.pyplot as plt

from infrastructure.base_viewer import MatplotViewer
from infrastructure.viewable import Viewable
from codemaat_repository import CodemaatRepository

class CodeChurnViewer(MatplotViewer, Viewable):
    def render(self, repository: CodemaatRepository, out_file: str | None = None) -> None:
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

        super().output(plt, fig, out_file=out_file)
    

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Plot the code churn rate over time")
    parser.add_argument(
        "--out-file",
        "-o",
        type=str,
        default=None,
        help="Optional path to save the plot image",
    )
    args = parser.parse_args()
    viewer = CodeChurnViewer().render(CodemaatRepository(), out_file=args.out_file)