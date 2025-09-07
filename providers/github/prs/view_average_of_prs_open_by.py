import argparse
import matplotlib.pyplot as plt

from infrastructure.base_viewer import MatplotViewer
from prs.prs_repository import LoadPrs


class ViewAverageOfPrsOpenBy(MatplotViewer):
    def main(
        self,
        out_file: str | None = None,
        author: str | None = None,
        labels: str | None = None,
        aggregate_by: str = "month",
    ):
        repository = LoadPrs()

        print(f"  → {len(repository.merged())} PRs were merged")

        print(f"  → {len(repository.closed())} PRs were closed")

        if aggregate_by == "week":
            x_vals, y_vals = repository.average_by_week(author=author, labels=labels)
            title = "Average PR Open Days by Week"
            xlabel = "Week"
        else:
            x_vals, y_vals = repository.average_by_month(author=author, labels=labels)
            title = "Average PR Open Days by Month"
            xlabel = "Month"

        fig, ax = plt.subplots(figsize=(12, 5))
        ax.plot(x_vals, y_vals, marker="o", color="tab:blue")
        for i, avg in enumerate(y_vals):
            ax.annotate(
                f"{avg:.1f}",
                (x_vals[i], avg),
                textcoords="offset points",
                xytext=(0, 5),
                ha="center",
            )
        ax.set_title(title)
        ax.set_xlabel(xlabel)
        ax.set_ylabel("Average Days Open")
        plt.xticks(rotation=45)
        fig.tight_layout()

        super().output(plt, fig, out_file)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Plot average PR open")
    parser.add_argument(
        "--out-file",
        "-o",
        type=str,
        default=None,
        help="Optional path to save the plot image",
    )
    parser.add_argument(
        "--author",
        "-a",
        type=str,
        default=None,
        help="Optional username to filter PRs by author",
    )
    parser.add_argument(
        "--labels",
        "-l",
        type=str,
        default=None,
        help="Comma-separated list of label names to filter PRs by (e.g. bug,enhancement)",
    )
    parser.add_argument(
        "--aggregate-by",
        "-g",
        choices=["month", "week"],
        default="month",
        help="Aggregate the averages by 'month' (default) or 'week'",
    )
    args = parser.parse_args()
    ViewAverageOfPrsOpenBy().main(
        out_file=args.out_file,
        author=args.author,
        labels=args.labels,
        aggregate_by=args.aggregate_by,
    )
