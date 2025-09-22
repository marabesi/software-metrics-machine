import matplotlib.pyplot as plt
from collections import Counter

from infrastructure.base_viewer import MatplotViewer
from providers.github.workflows.repository_workflows import LoadWorkflows


class ViewWorkflowByStatus(MatplotViewer):
    def __init__(self, repository: LoadWorkflows):
        self.repository = repository

    def main(
        self,
        out_file: str | None = None,
        workflow_name: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> None:
        if start_date and end_date:
            filters = {"start_date": start_date, "end_date": end_date}
            runs = self.repository.runs(filters)
        else:
            runs = self.repository.runs()

        if workflow_name:
            name_low = workflow_name.lower()
            runs = [
                r for r in runs if (r.get("name") or "").lower().find(name_low) != -1
            ]

        # workflow conclusions
        status_counts = Counter(run.get("conclusion") or "undefined" for run in runs)

        print(f"Total workflow runs after filters: {len(runs)}")

        print("Workflow status counts:", status_counts)
        fig, ax = plt.subplots(figsize=super().get_fig_size())
        bars = ax.bar(
            list(status_counts.keys()), list(status_counts.values()), color="skyblue"
        )
        ax.set_title("Status of Pipeline Runs")
        if workflow_name:
            ax.set_title(
                f"Status of Pipeline Runs for '{workflow_name}' - Total {len(runs)}"
            )
        ax.set_xlabel("Status")
        ax.set_ylabel("Count")
        for bar in bars:
            height = bar.get_height()
            ax.annotate(
                f"{int(height)}",
                xy=(bar.get_x() + bar.get_width() / 2, height),
                xytext=(0, 3),
                textcoords="offset points",
                ha="center",
                va="bottom",
            )

        fig.tight_layout()

        return super().output(plt, fig, out_file)
