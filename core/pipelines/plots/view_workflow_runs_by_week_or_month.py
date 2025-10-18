import matplotlib.pyplot as plt
import matplotlib.dates as mdates

from core.infrastructure.base_viewer import BaseViewer
from core.pipelines.aggregates.pipeline_workflow_runs_by_week_or_month import (
    PipelineWorkflowRunsByWekOrMonth,
)
from core.pipelines.pipelines_repository import PipelinesRepository


class ViewWorkflowRunsByWeekOrMonth(BaseViewer):

    def __init__(self, repository: PipelinesRepository):
        self.repository = repository

    def main(
        self,
        aggregate_by: str,
        workflow_path: str | None = None,
        out_file: str | None = None,
        raw_filters: str | None = None,
        include_defined_only: bool = False,
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> None:
        result = PipelineWorkflowRunsByWekOrMonth(repository=self.repository).main(
            aggregate_by=aggregate_by,
            workflow_path=workflow_path,
            raw_filters=raw_filters,
            include_defined_only=include_defined_only,
            start_date=start_date,
            end_date=end_date,
        )

        rep_dates = result.rep_dates
        periods = result.periods
        workflow_names = result.workflow_names
        data_matrix = result.data_matrix
        runs = result.runs

        x_vals = mdates.date2num(rep_dates)

        # plotting
        fig, ax = plt.subplots(
            figsize=super().get_fig_size()
        )  # Ensure a consistent width for better readability
        bottom = [0] * len(periods)
        colors = plt.cm.tab20.colors
        bar_width = 6.5 if aggregate_by == "week" else 20

        for i, name in enumerate(workflow_names):
            vals = data_matrix[i]
            cont = ax.bar(
                x_vals,
                vals,
                bottom=bottom,
                label=name,
                color=colors[i % len(colors)],
                width=bar_width,
                align="center",
            )
            try:
                labels = [str(v) if v else "" for v in vals]
                ax.bar_label(cont, labels=labels, label_type="center", fontsize=8)
            except Exception:
                pass
            bottom = [b + v for b, v in zip(bottom, vals)]

        ax.set_xlabel("Week (YYYY-WW)" if aggregate_by == "week" else "Month (YYYY-MM)")
        ax.set_ylabel("Number of runs")
        ax.set_title(
            "Workflow runs per %s by workflow name (%d in total)"
            % ("week" if aggregate_by == "week" else "month", len(runs))
        )
        ax.legend(loc="upper left", bbox_to_anchor=(1, 1))

        months = [d.month for d in rep_dates]
        month_change_idxs = [
            i for i in range(1, len(months)) if months[i] != months[i - 1]
        ]
        for idx in month_change_idxs:
            xline = (x_vals[idx - 1] + x_vals[idx]) / 2.0
            ax.axvline(x=xline, color="0.7", linestyle="--", linewidth=0.8)

        tick_labels = []
        for p, d in zip(periods, rep_dates):
            if d:
                month = d.strftime("%b %Y")
            else:
                month = ""
            if aggregate_by == "week":
                tick_labels.append(f"{p}\n{month}")
            else:
                tick_labels.append(month)
        if len(x_vals) != 0:
            ax.set_xticks(x_vals)
            ax.set_xticklabels(tick_labels)
            plt.xticks(rotation=45)
            ax.set_xlim(min(x_vals) - 2, max(x_vals) + 2)
        fig.tight_layout()
        return super().output(plt, fig, out_file, repository=self.repository)
