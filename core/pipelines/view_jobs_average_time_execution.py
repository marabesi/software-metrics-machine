import matplotlib.pyplot as plt

import pandas as pd

from core.infrastructure.base_viewer import MatplotViewer, PlotResult
from core.pipelines.aggregates.jobs_average_time_execution import (
    JobsByAverageTimeExecution,
)
from core.pipelines.pipelines_repository import PipelinesRepository


class ViewJobsByAverageTimeExecution(MatplotViewer):

    def __init__(self, repository: PipelinesRepository):
        self.repository = repository

    def main(
        self,
        workflow_path: str | None = None,
        out_file: str | None = None,
        _cli_filters: dict = {},
        top: int = 20,
        exclude_jobs: str = None,
        start_date: str | None = None,
        end_date: str | None = None,
        force_all_jobs: bool = False,
        job_name: str | None = None,
    ) -> PlotResult:
        result = JobsByAverageTimeExecution(repository=self.repository).main(
            workflow_path=workflow_path,
            _cli_filters=_cli_filters,
            top=top,
            exclude_jobs=exclude_jobs,
            start_date=start_date,
            end_date=end_date,
            force_all_jobs=force_all_jobs,
            job_name=job_name,
        )
        averages = result.averages
        runs = result.runs
        jobs = result.jobs
        counts = result.counts

        if not averages:
            print("No job durations found after filtering")
            fig, plot_ax = plt.subplots(1, 1, figsize=super().get_fig_size())
            plot_ax.text(0.5, 0.5, "No job durations found", ha="center", va="center")
            plot_ax.axis("off")
            fig.tight_layout()
            super().output(plt, fig, out_file, repository=self.repository)
            return PlotResult(matplotlib=fig, data=pd.DataFrame(averages))

        names, mins = zip(*averages)

        fig, plot_ax = plt.subplots(1, 1, figsize=super().get_fig_size())

        y_pos = list(range(len(names)))[::-1]
        plot_ax.barh(y_pos, mins, color="#4c78a8")
        plot_ax.set_yticks(y_pos)
        plot_ax.set_yticklabels(names)
        plot_ax.set_xlabel("Average job duration (minutes)")
        plot_ax.set_title(
            f"Top {len(names)} jobs by average duration for {len(runs)} runs - {len(jobs)} jobs"
        )
        if workflow_path:
            plot_ax.set_title(
                f"Top {len(names)} jobs by average duration for '{workflow_path}' - {len(runs)} runs - {len(jobs)} jobs"
            )

        counts_for_names = [counts.get(n, 0) for n in names]
        for i, v in enumerate(mins):
            cnt = counts_for_names[i]
            plot_ax.text(
                v + max(0.1, max(mins) * 0.01),
                y_pos[i],
                f"{v:.2f}m ({cnt})",
                va="center",
            )

        # show the sum of the averages (minutes) prominently on the plot
        try:
            total_avg = sum(mins)
            plot_ax.text(
                0.99,
                0.99,
                f"Sum of averages: {total_avg:.2f} min",
                transform=plot_ax.transAxes,
                ha="right",
                va="top",
                fontsize=9,
                bbox=dict(facecolor="white", alpha=0.6, edgecolor="none"),
            )
        except Exception:
            pass

        fig.tight_layout()

        return PlotResult(
            matplotlib=super().output(plt, fig, out_file, repository=self.repository),
            data=pd.DataFrame(averages),
        )
