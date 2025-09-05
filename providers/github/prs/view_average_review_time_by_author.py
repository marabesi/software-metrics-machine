import argparse
import matplotlib.pyplot as plt

from infrastructure.configuration import Configuration
from infrastructure.base_viewer import MatplotViewer
from prs.prs_repository import LoadPrs
from collections import defaultdict
from typing import List, Tuple
from datetime import datetime


class ViewAverageReviewTimeByAuthor(MatplotViewer):

    def plot_average_open_time(self, pairs: List[Tuple[str, float]], title: str = "Average PR open time until merged by author", out_file: str | None = None) -> None:
        """pairs: list of (author, avg_days)"""
        if not pairs:
            print("No merged PRs to plot")
            return

        authors, avgs = zip(*pairs)
        # horizontal bar chart with largest on top
        fig, ax = plt.subplots(figsize=(10, max(4, len(authors) * 0.5)))
        y_pos = range(len(authors))[::-1]
        ax.barh(y_pos, avgs, color="#4c78a8")
        ax.set_yticks(y_pos)
        ax.set_yticklabels(authors)
        ax.set_xlabel("Average days PR open before merged")
        ax.set_title(title)

        for i, v in enumerate(avgs):
            ax.text(v + max(0.1, max(avgs) * 0.01), y_pos[i], f"{v:.2f}", va="center")

        fig.tight_layout()
        super().output(plt, fig, out_file)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Plot average PR open time by author")
    parser.add_argument("--top", type=int, default=10, help="How many top authors to show")
    parser.add_argument("--labels", "-l", type=str, default=None,
                        help="Comma-separated list of label names to filter PRs by (e.g. bug,enhancement)")
    parser.add_argument("--out-file", "-o", type=str, default=None, help="Optional path to save the plot image")
    args = parser.parse_args()

    repo = LoadPrs()
    prs = getattr(repo, "all_prs", [])

    def average_open_time_by_author(prs: List[dict], top: int = 10) -> List[Tuple[str, float]]:
        """Compute average open time in days for merged PRs grouped by author.

        Returns top authors sorted by average descending.
        """
        sums = defaultdict(float)
        counts = defaultdict(int)
        for pr in prs:
            merged = pr.get("merged_at")
            created = pr.get("created_at")
            if not merged or not created:
                continue
            try:
                dt_created = datetime.fromisoformat(created.replace("Z", "+00:00"))
                dt_merged = datetime.fromisoformat(merged.replace("Z", "+00:00"))
            except Exception:
                continue
            delta_days = (dt_merged - dt_created).total_seconds() / 86400.0
            user = pr.get("user") or {}
            login = user.get("login") if isinstance(user, dict) else str(user)
            if not login:
                login = "<unknown>"
            sums[login] += delta_days
            counts[login] += 1

        averages = []
        for login, total in sums.items():
            averages.append((login, total / counts[login]))

        # sort by average descending (longest open first)
        averages.sort(key=lambda x: x[1], reverse=True)
        return averages[:top]

    if args.labels:
        labels = [s.strip() for s in args.labels.split(",") if s.strip()]
        prs = repo.filter_prs_by_labels(prs, labels)

    print(f"Loaded {len(prs)} PRs after filtering")

    top = average_open_time_by_author(prs, top=args.top)
    ViewAverageReviewTimeByAuthor().plot_average_open_time(top, title=f"Top {len(top)} PR authors by avg open time", out_file=args.out_file)
