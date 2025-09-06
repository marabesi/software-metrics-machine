import argparse
import matplotlib.pyplot as plt

from infrastructure.base_viewer import MatplotViewer
from infrastructure.viewable import Viewable
from codemaat_repository import CodemaatRepository


class EntityChurnViewer(MatplotViewer, Viewable):
    def render(self, repo: CodemaatRepository, out_file: str | None = None) -> None:
        df = repo.get_entity_churn()

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
    args = parser.parse_args()
    viewer = EntityChurnViewer().render(CodemaatRepository(), out_file=args.out_file)
