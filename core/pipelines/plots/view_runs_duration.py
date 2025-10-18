import matplotlib.pyplot as plt

from core.infrastructure.base_viewer import MatplotViewer
from core.pipelines.pipelines_repository import PipelinesRepository


class ViewRunsDuration(MatplotViewer):
    def __init__(self, repository: PipelinesRepository):
        self.repository = repository

    def main(
        self,
        out_file: str | None = None,
        workflow_path: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
        max_runs: int = 50,
        metric: str = "avg",
        sort_by: str = "avg",
    ) -> None:
        filters = {
            "start_date": start_date,
            "end_date": end_date,
            "workflow_path": workflow_path,
        }

        data = self.repository.get_workflows_run_duration(filters)

        print(f"Found {data["total"]} runs after filtering")

        rows = data["rows"]
        # choose sort key
        sort_key = {
            "avg": lambda r: r[2],
            "sum": lambda r: r[3],
            "count": lambda r: r[1],
        }.get(sort_by, lambda r: r[2])

        rows.sort(key=sort_key, reverse=True)
        rows = rows[:max_runs]

        names = [r[0] for r in rows]
        counts = [r[1] for r in rows]
        avgs = [r[2] for r in rows]
        sums = [r[3] for r in rows]

        # pick metric to plot
        if metric == "sum":
            values = sums
            ylabel = "Total minutes"
            title_metric = "Total"
        elif metric == "count":
            values = counts
            ylabel = "Count"
            title_metric = "Count"
        else:
            values = avgs
            ylabel = "Average minutes"
            title_metric = "Average"

        fig, ax = plt.subplots(figsize=super().get_fig_size())
        x = list(range(len(names)))
        bars = ax.bar(x, values, color="tab:blue")

        # annotate bars with counts and exact values
        for i, bar in enumerate(bars):
            v = values[i]
            cnt = counts[i]
            ax.text(
                bar.get_x() + bar.get_width() / 2,
                v + max(0.1, max(values) * 0.01),
                f"{v:.1f}",
                ha="center",
                va="bottom",
                fontsize=8,
            )
            ax.text(
                bar.get_x() + bar.get_width() / 2,
                max(0.01, v * 0.02),
                f"n={cnt}",
                ha="center",
                va="bottom",
                fontsize=7,
                color="white",
            )

        ax.set_xticks(x)
        ax.set_xticklabels(names, rotation=45, ha="right")
        ax.set_ylabel(ylabel)
        ax.set_title(f"Runs aggregated by name - {title_metric} ({len(rows)} items)")
        fig.tight_layout()

        return super().output(plt, fig, out_file, repository=self.repository)
