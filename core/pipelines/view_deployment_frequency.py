import matplotlib.pyplot as plt
from datetime import datetime

import pandas as pd

from core.infrastructure.base_viewer import MatplotViewer, PlotResult
from core.pipelines.aggregates.deployment_frequency import DeploymentFrequency
from core.pipelines.repository_workflows import LoadWorkflows


class ViewDeploymentFrequency(MatplotViewer):
    def __init__(self, repository: LoadWorkflows):
        self.repository = repository

    def plot(
        self,
        workflow_path: str,
        job_name: str,
        out_file: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> PlotResult:
        aggregated = DeploymentFrequency(repository=self.repository).execute(
            workflow_path=workflow_path,
            job_name=job_name,
            start_date=start_date,
            end_date=end_date,
        )

        daily_counts = aggregated["daily_counts"]
        weekly_counts = aggregated["weekly_counts"]
        monthly_counts = aggregated["monthly_counts"]
        days = aggregated["days"]
        weeks = aggregated["weeks"]
        months = aggregated["months"]

        fig, ax = plt.subplots(3, 1, figsize=super().get_fig_size())

        # Plot daily counts
        ax[0].bar(days, daily_counts, color="orange")
        ax[0].set_title("Daily Deployment Frequency")
        ax[0].set_ylabel("Deployments")
        ax[0].tick_params(axis="x", rotation=45)

        for i, count in enumerate(daily_counts):
            ax[0].text(i, count, str(count), ha="center", va="bottom")

        # Plot weekly counts
        ax[1].bar(weeks, weekly_counts, color="blue")
        ax[1].set_title("Weekly Deployment Frequency")
        ax[1].set_ylabel("Deployments")
        ax[1].tick_params(axis="x", rotation=45)

        for i, count in enumerate(weekly_counts):
            ax[1].text(i, count, str(count), ha="center", va="bottom")

        week_dates = [datetime.strptime(week + "-1", "%Y-W%W-%w") for week in weeks]
        current_month = None

        for i, week_date in enumerate(week_dates):
            if current_month is None:
                current_month = week_date.month

            if week_date.month != current_month:
                ax[1].axvline(x=i - 0.5, color="gray", linestyle="--", alpha=0.7)
                current_month = week_date.month

        ax[2].bar(months, monthly_counts, color="green")
        ax[2].set_title("Monthly Deployment Frequency")
        ax[2].set_xlabel("Time")
        ax[2].set_ylabel("Deployments")
        ax[2].tick_params(axis="x", rotation=45)

        for i, count in enumerate(monthly_counts):
            ax[2].text(i, count, str(count), ha="center", va="bottom")

        fig.tight_layout()

        return PlotResult(
            super().output(plt, fig, out_file, repository=self.repository),
            pd.DataFrame(aggregated),
        )
