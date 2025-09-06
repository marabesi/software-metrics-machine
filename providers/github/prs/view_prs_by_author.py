import matplotlib.pyplot as plt

from infrastructure.base_viewer import MatplotViewer
from prs.prs_repository import LoadPrs
import argparse
from collections import Counter
from typing import List, Tuple


class ViewPrsByAuthor(MatplotViewer):

    def plot_top_authors(
        self,
        pairs: List[Tuple[str, int]],
        title: str = "Top PR authors",
        out_file: str | None = None,
    ) -> None:
        if not pairs:
            print("No PRs to plot")
            return

        authors, counts = zip(*pairs)
        # horizontal bar chart with largest on top
        fig, ax = plt.subplots(figsize=(10, max(4, len(authors) * 0.5)))
        y_pos = range(len(authors))[::-1]
        ax.barh(y_pos, counts, color="#4c78a8")
        ax.set_yticks(y_pos)
        ax.set_yticklabels(authors)
        ax.set_xlabel("Number of PRs")
        ax.set_title(title)

        for i, v in enumerate(counts):
            ax.text(v + max(1, max(counts) * 0.01), y_pos[i], str(v), va="center")

        fig.tight_layout()

        super().output(plt, fig, out_file)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Plot number of PRs by author")
    parser.add_argument(
        "--top", type=int, default=10, help="How many top authors to show"
    )
    parser.add_argument(
        "--labels",
        "-l",
        type=str,
        default=None,
        help="Comma-separated list of label names to filter PRs by (e.g. bug,enhancement)",
    )
    parser.add_argument(
        "--out-file",
        "-o",
        type=str,
        default=None,
        help="Optional path to save the plot image",
    )
    args = parser.parse_args()

    repo = LoadPrs()
    prs = repo.all_prs

    def top_authors(prs: List[dict], top: int = 10) -> List[Tuple[str, int]]:
        counts = Counter()
        for pr in prs:
            user = pr.get("user") or {}
            login = user.get("login") if isinstance(user, dict) else str(user)
            if not login:
                login = "<unknown>"
            counts[login] += 1
        return counts.most_common(top)

    if args.labels:
        labels = [s.strip() for s in args.labels.split(",") if s.strip()]
        prs = repo.filter_prs_by_labels(prs, labels)

    print(f"Loaded {len(prs)} PRs after filtering")

    top = top_authors(prs, top=args.top)
    ViewPrsByAuthor().plot_top_authors(
        top, title=f"Top {len(top)} PR authors", out_file=args.out_file
    )
