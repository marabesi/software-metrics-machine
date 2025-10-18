import matplotlib.pyplot as plt
import pandas as pd

from core.infrastructure.base_viewer import MatplotViewer, PlotResult
from core.pipelines.aggregates.jobs_by_status import JobsByStatus
from core.pipelines.pipelines_repository import PipelinesRepository


class ViewJobsByStatus(MatplotViewer):

    def __init__(self, repository: PipelinesRepository):
        self.repository = repository

    def main(
        self,
        job_name: str,
        workflow_path: str | None = None,
        out_file: str | None = None,
        with_pipeline: bool = False,
        aggregate_by_week: bool = False,
        raw_filters: dict = {},
        start_date: str | None = None,
        end_date: str | None = None,
        force_all_jobs: bool = False,
    ) -> None:
        aggregate = JobsByStatus(repository=self.repository).main(
            job_name=job_name,
            workflow_path=workflow_path,
            aggregate_by_week=aggregate_by_week,
            raw_filters=raw_filters,
            start_date=start_date,
            end_date=end_date,
            force_all_jobs=force_all_jobs,
        )

        status_counts = aggregate.status_counts
        runs = aggregate.runs
        dates = aggregate.dates
        conclusions = aggregate.conclusions
        matrix = aggregate.matrix
        display_job_name = aggregate.display_job_name
        display_workflow_name = aggregate.display_pipeline_name

        # If with_pipeline is True show both workflow summary and job chart side-by-side
        if with_pipeline:
            fig, (ax_left, ax_right) = plt.subplots(
                1, 2, figsize=super().get_fig_size()
            )

            # plot status counts on the left axis
            bars = ax_left.bar(
                list(status_counts.keys()),
                list(status_counts.values()),
                color="skyblue",
            )

            ax_left.set_title(f"Status of Workflows - {len(runs)} runs")
            if workflow_path:
                ax_left.set_title(
                    f"Status of Workflows ({workflow_path}) - {len(runs)} runs"
                )

            ax_left.set_xlabel("Status")
            ax_left.set_ylabel("Count")
            for bar in bars:
                height = bar.get_height()
                ax_left.annotate(
                    f"{int(height)}",
                    xy=(bar.get_x() + bar.get_width() / 2, height),
                    xytext=(0, 3),
                    textcoords="offset points",
                    ha="center",
                    va="bottom",
                )

            plot_ax = ax_right
        else:
            fig, plot_ax = plt.subplots(1, 1, figsize=super().get_fig_size())

        # plot delivery executions on the chosen axis as stacked bars by conclusion
        if dates and matrix:
            # use integer x positions for stability and to allow numeric annotations
            x = list(range(len(dates)))

            # compute true totals per column (used for annotations)
            totals = [sum(row[i] for row in matrix) for i in range(len(dates))]
            max_total = max(totals) if totals else 0

            # determine a minimum visible height for any non-zero segment
            min_display = max(0.5, max(1.0, max_total) * 0.02)

            # color mapping for conclusions
            color_map = {
                "success": "#2ca02c",
                "failure": "#d62728",
                "cancelled": "#7f7f7f",
                "timed_out": "#ff7f0e",
                "unknown": "#8c564b",
                "None": "#1f77b4",
            }
            cmap = plt.get_cmap("tab20")

            display_bottoms = [0] * len(dates)
            for idx, (conc, row) in enumerate(zip(conclusions, matrix)):
                color = color_map.get(conc, cmap(idx))
                # ensure very small non-zero counts are visible by bumping them to min_display
                display_row = [
                    (v if v == 0 else (v if v >= min_display else min_display))
                    for v in row
                ]
                container = plot_ax.bar(
                    x, display_row, bottom=display_bottoms, label=conc, color=color
                )
                # label each segment with its true count (only where >0)
                try:
                    seg_labels = [str(v) if v else "" for v in row]
                    plot_ax.bar_label(
                        container, labels=seg_labels, label_type="center", fontsize=8
                    )
                except Exception:
                    pass
                display_bottoms = [b + d for b, d in zip(display_bottoms, display_row)]

            # title/xlabel depend on aggregation mode
            if aggregate_by_week:
                plot_ax.set_title(
                    f'Executions of job "{display_job_name}" in workflow "{display_workflow_name}" by week (stacked by conclusion)'  # noqa
                )
                plot_ax.set_xlabel("Week (YYYY-Www)")
            else:
                plot_ax.set_title(
                    f'Executions of job "{display_job_name}" in workflow "{display_workflow_name}" by day (stacked by conclusion)'  # noqa
                )
                plot_ax.set_xlabel("Day")

            plot_ax.set_ylabel("Executions")
            plot_ax.tick_params(axis="x", rotation=45)
            plot_ax.set_xticks(x)
            plot_ax.set_xticklabels(dates)
            plot_ax.legend(title="conclusion")

            # annotate totals on top of each stacked bar, using true totals
            offset = max(1, max(display_bottoms) * 0.02)
            for i, total in enumerate(totals):
                y = display_bottoms[i]
                plot_ax.text(i, y + offset, str(total), ha="center", va="bottom")
            # ensure y-limits provide some headroom
            plot_ax.set_ylim(
                0, max(display_bottoms) + max(1.0, max(display_bottoms) * 0.05)
            )
        else:
            plot_ax.text(
                0.5,
                0.5,
                f"No {job_name} job executions found",
                ha="center",
                va="center",
            )
            plot_ax.set_axis_off()

        fig.tight_layout()

        return PlotResult(
            super().output(plt, fig, out_file, repository=self.repository),
            pd.DataFrame(aggregate.runs),
        )
