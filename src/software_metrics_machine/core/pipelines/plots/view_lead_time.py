from datetime import datetime
import matplotlib.pyplot as plt
import pandas as pd

from software_metrics_machine.core.infrastructure.base_viewer import (
    BaseViewer,
    PlotResult,
)
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)


class ViewLeadTime(BaseViewer):
    def __init__(self, repository: PipelinesRepository):
        self.repository = repository

    def plot(
        self,
        workflow_path: str,
        job_name: str,
        out_file: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> None:
        # Filter jobs by the given job_name
        filtered_jobs = [job for job in self.all_jobs if job.get("name") == job_name]

        # Calculate lead times (time taken for each job to run)
        lead_times = []
        for job in filtered_jobs:
            start_time = datetime.fromisoformat(job.get("start_time"))
            end_time = datetime.fromisoformat(job.get("end_time"))
            lead_times.append(
                (start_time, end_time, (end_time - start_time).total_seconds())
            )

        # Create a DataFrame for lead times
        df = pd.DataFrame(
            lead_times, columns=["start_time", "end_time", "lead_time_seconds"]
        )

        # Add week and month columns
        df["week"] = df["start_time"].dt.to_period("W").astype(str)
        df["month"] = df["start_time"].dt.to_period("M").astype(str)

        # Calculate weekly and monthly averages
        weekly_avg = df.groupby("week")["lead_time_seconds"].mean().reset_index()
        monthly_avg = df.groupby("month")["lead_time_seconds"].mean().reset_index()

        # Plot the data
        fig, ax = plt.subplots(2, 1, figsize=(10, 8))

        # Weekly plot
        ax[0].plot(weekly_avg["week"], weekly_avg["lead_time_seconds"], marker="o")
        ax[0].set_title(f"Weekly Average Lead Time for {job_name}")
        ax[0].set_xlabel("Week")
        ax[0].set_ylabel("Lead Time (seconds)")
        ax[0].tick_params(axis="x", rotation=45)

        # Monthly plot
        ax[1].plot(
            monthly_avg["month"],
            monthly_avg["lead_time_seconds"],
            marker="o",
            color="orange",
        )
        ax[1].set_title(f"Monthly Average Lead Time for {job_name}")
        ax[1].set_xlabel("Month")
        ax[1].set_ylabel("Lead Time (seconds)")
        ax[1].tick_params(axis="x", rotation=45)

        plt.tight_layout()

        fig = super().output(plt, fig, out_file, repository=self.repository)
        return PlotResult(plot=fig, data=df).plot
