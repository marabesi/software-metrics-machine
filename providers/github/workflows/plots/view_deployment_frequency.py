import matplotlib.pyplot as plt

from infrastructure.base_viewer import MatplotViewer
from providers.github.workflows.repository_workflows import LoadWorkflows


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
    ) -> None:
        """
        Plot deployment frequency based on the given workflow file and job name.

        :param workflow_path: Path to the workflow file.
        :param job_name: Name of the job to track deployments.
        :param out_file: File to save the chart.
        :param start_date: Start date for filtering runs.
        :param end_date: End date for filtering runs.
        """

        if start_date and end_date:
            filters = {"start_date": start_date, "end_date": end_date}
            runs = self.repository.runs(filters)
        else:
            runs = self.repository.runs()

        if workflow_path:
            name_low = workflow_path.lower()
            runs = [
                r for r in runs if (r.get("path") or "").lower().find(name_low) != -1
            ]

        print(f"Filtered to {len(runs)} runs after applying workflow path filter")

        df = self.repository.get_deployment_frequency_for_job(job_name=job_name)

        weekly_counts = df["weekly_counts"]
        monthly_counts = df["monthly_counts"]
        weeks = df["weeks"]
        months = df["months"]

        fig, ax = plt.subplots(2, 1, figsize=super().get_fig_size(), sharex=True)

        ax[0].bar(weeks, weekly_counts, color="blue")
        ax[0].set_title("Weekly Deployment Frequency")
        ax[0].set_ylabel("Deployments")
        ax[0].tick_params(axis="x", rotation=45)

        for i, count in enumerate(weekly_counts):
            ax[0].text(i, count, str(count), ha="center", va="bottom")

        ax[1].bar(months, monthly_counts, color="green")
        ax[1].set_title("Monthly Deployment Frequency")
        ax[1].set_xlabel("Time")
        ax[1].set_ylabel("Deployments")
        ax[1].tick_params(axis="x", rotation=45)

        for i, count in enumerate(monthly_counts):
            ax[1].text(i, count, str(count), ha="center", va="bottom")

        fig.tight_layout()

        return super().output(plt, fig, out_file, repository=self.repository)
