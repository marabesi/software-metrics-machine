import argparse
import matplotlib.pyplot as plt
from collections import Counter

from infrastructure.base_viewer import MatplotViewer
from repository_workflows import LoadWorkflows


class ViewWorkflowByStatus(MatplotViewer):
    def main(
        self,
        out_file: str | None = None,
        workflow_name: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> None:
        workflows = LoadWorkflows()

        if start_date and end_date:
            filters = {"start_date": start_date, "end_date": end_date}
            runs = workflows.runs(filters)
        else:
            runs = workflows.runs()

        if workflow_name:
            name_low = workflow_name.lower()
            runs = [
                r for r in runs if (r.get("name") or "").lower().find(name_low) != -1
            ]

        # workflow conclusions
        status_counts = Counter(run.get("conclusion") or "undefined" for run in runs)

        print(f"Total workflow runs after filters: {len(runs)}")

        print("Workflow status counts:", status_counts)
        fig, ax = plt.subplots(figsize=(8, 5))
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

        super().output(plt, fig, out_file)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Plot pipeline status summary")
    parser.add_argument(
        "--out-file",
        "-o",
        type=str,
        default=None,
        help="Optional path to save the plot image",
    )
    parser.add_argument(
        "--workflow-name",
        "-w",
        type=str,
        default=None,
        help="Optional workflow name (case-insensitive substring) to filter runs",
    )
    parser.add_argument(
        "--start-date",
        type=str,
        help="Start date (inclusive) in YYYY-MM-DD",
    )
    parser.add_argument(
        "--end-date", type=str, help="End date (inclusive) in YYYY-MM-DD"
    )
    args = parser.parse_args()

    ViewWorkflowByStatus().main(
        out_file=args.out_file,
        workflow_name=args.workflow_name,
        start_date=args.start_date,
        end_date=args.end_date,
    )
