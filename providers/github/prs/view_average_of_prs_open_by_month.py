import argparse
import matplotlib.pyplot as plt

from infrastructure.base_viewer import MatplotViewer
from prs.prs_repository import LoadPrs

class ViewAverageOfPrsOpenByMonth(MatplotViewer):
    def main(self, out_file: str | None = None, author: str | None = None, labels = []):
        repository = LoadPrs()

        print(f"  → {len(repository.merged())} PRs were merged")

        print(f"  → {len(repository.closed())} PRs were closed")

        months, avg_by_month = repository.average_by_month(author=author, labels=labels)

        fig, ax = plt.subplots(figsize=(12, 5))
        ax.plot(months, avg_by_month, marker='o', color='tab:blue')
        for i, avg in enumerate(avg_by_month):
            ax.annotate(f'{avg:.1f}', (months[i], avg), textcoords="offset points", xytext=(0, 5), ha='center')
        ax.set_title("Average PR Open Days by Month")
        ax.set_xlabel("Month")
        ax.set_ylabel("Average Days Open")
        plt.xticks(rotation=45)
        fig.tight_layout()

        super().output(plt, fig, out_file)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Plot average PR open days by month")
    parser.add_argument("--out-file", "-o", type=str, default=None, help="Optional path to save the plot image")
    parser.add_argument("--author", "-a", type=str, default=None, help="Optional username to filter PRs by author")
    parser.add_argument("--labels", "-l", type=str, default=None, help="Comma-separated list of label names to filter PRs by (e.g. bug,enhancement)")
    args = parser.parse_args()
    ViewAverageOfPrsOpenByMonth().main(out_file=args.out_file, author=args.author, labels=args.labels)