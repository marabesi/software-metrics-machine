from collections import Counter
import matplotlib.pyplot as plt

from infrastructure.base_viewer import MatplotViewer
from providers.github.prs.prs_repository import LoadPrs
from typing import List, Tuple


class ViewPrsByAuthor(MatplotViewer):

    def plot_top_authors(
        self,
        title: str,
        top: int = 10,
        labels: List[str] | None = None,
        out_file: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> None:

        repo = LoadPrs()
        prs = repo.filter_prs_by_date_range(start_date=start_date, end_date=end_date)

        if not prs:
            print("No PRs to plot")
            return

        if labels:
            labels = [s.strip() for s in labels.split(",") if s.strip()]
            prs = repo.filter_prs_by_labels(prs, labels)

        print(f"Loaded {len(prs)} PRs after filtering")

        prs = self.top_authors(prs, top)

        authors, counts = zip(*prs)
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

        return super().output(plt, fig, out_file)

    def top_authors(self, prs: List[dict], top: int) -> List[Tuple[str, int]]:
        counts = Counter()
        for pr in prs:
            user = pr.get("user") or {}
            login = user.get("login") if isinstance(user, dict) else str(user)
            if not login:
                login = "<unknown>"
            counts[login] += 1
        return counts.most_common(top)
