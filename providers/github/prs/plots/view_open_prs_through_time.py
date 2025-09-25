import matplotlib.pyplot as plt

from infrastructure.base_viewer import MatplotViewer
from providers.github.prs.prs_repository import LoadPrs


class ViewOpenPrsThroughTime(MatplotViewer):
    def __init__(self, repository: LoadPrs):
        self.repository = repository

    def main(
        self,
        title: str,
        out_file: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
        authors: str | None = None,
    ) -> None:
        prs = self.repository.prs_with_filters(
            {"start_date": start_date, "end_date": end_date, "authors": authors}
        )

        if not prs:
            print("No PRs to plot")
            return

        timeline = {}

        for pr in prs:
            created_at = pr.get("created_at")[:10]  # Extract date only
            closed_at = pr.get("closed_at")

            if created_at not in timeline:
                timeline[created_at] = {"opened": 0, "closed": 0}

            timeline[created_at]["opened"] += 1

            if closed_at:
                closed_date = closed_at[:10]
                if closed_date not in timeline:
                    timeline[closed_date] = {"opened": 0, "closed": 0}
                timeline[closed_date]["closed"] += 1

        dates = sorted(timeline.keys())
        opened = [timeline[date]["opened"] for date in dates]
        closed = [timeline[date]["closed"] for date in dates]

        fig, ax = plt.subplots(figsize=super().get_fig_size())

        ax.bar(dates, opened, label="Opened", color="blue")
        for i, count in enumerate(opened):
            ax.text(i, count, str(count), ha="center", va="bottom")

        ax.bar(dates, closed, label="Closed", color="red", bottom=opened)
        for i, count in enumerate(closed):
            ax.text(i, opened[i] + count, str(count), ha="center", va="bottom")

        ax.set_xlabel("Date")
        ax.set_ylabel("Number of PRs")
        ax.set_title(title)
        ax.legend()
        plt.xticks(rotation=45, ha="right")

        fig.tight_layout()

        return super().output(plt, fig, out_file, repository=self.repository)
