import matplotlib.pyplot as plt

from infrastructure.base_viewer import MatplotViewer
from providers.github.prs.prs_repository import LoadPrs
from collections import defaultdict
from typing import List, Tuple
from datetime import datetime


class ViewAverageReviewTimeByAuthor(MatplotViewer):

    def __init__(self, repository: LoadPrs):
        self.repository = repository

    def plot_average_open_time(
        self,
        title: str,
        top: int = 10,
        labels: List[str] | None = None,
        out_file: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> None:
        """pairs: list of (author, avg_days)"""

        all_prs = self.repository.all_prs
        pairs = self.repository.filter_by_date_range(
            all_prs, start_date=start_date, end_date=end_date
        )

        if not pairs:
            print("No merged PRs to plot")
            return

        if labels:
            labels = [s.strip() for s in labels.split(",") if s.strip()]
            pairs = self.repository.filter_prs_by_labels(pairs, labels)

        pairs = self.__average_open_time_by_author(pairs, top)

        if len(pairs) == 0:
            print("No PRs to plot after filtering")
            return

        authors, avgs = zip(*pairs)
        # horizontal bar chart with largest on top
        fig, ax = plt.subplots(figsize=(super().get_fig_size()))
        y_pos = range(len(authors))[::-1]
        ax.barh(y_pos, avgs, color="#4c78a8")
        ax.set_yticks(y_pos)
        ax.set_yticklabels(authors)
        ax.set_xlabel("Average days PR open before merged")
        ax.set_title(title)

        for i, v in enumerate(avgs):
            ax.text(v + max(0.1, max(avgs) * 0.01), y_pos[i], f"{v:.2f}", va="center")

        fig.tight_layout()
        return super().output(plt, fig, out_file)

    def __average_open_time_by_author(
        self, prs: List[dict], top: int
    ) -> List[Tuple[str, float]]:
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
