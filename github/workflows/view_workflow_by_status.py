import argparse
import matplotlib.pyplot as plt
from collections import Counter

from base_viewer import MatplotViewer
from repository_workflows import LoadWorkflows

class ViewWorkflowByStatus(MatplotViewer):
    def main(self, out_file: str | None = None, workflow_name: str | None = None):
        workflows = LoadWorkflows()
        runs = workflows.runs()

        print(f"Total workflow runs: {len(runs)}")
        # optional filter by workflow name (case-insensitive substring match)
        if workflow_name:
            name_low = workflow_name.lower()
            runs = [r for r in runs if (r.get('name') or '').lower().find(name_low) != -1]

        # workflow conclusions
        status_counts = Counter(run.get('conclusion') or 'None' for run in runs)

        print(f"Total workflow runs: {len(runs)}")

        print("Workflow status counts:", status_counts)
        fig, ax = plt.subplots(figsize=(8, 5))
        bars = ax.bar(list(status_counts.keys()), list(status_counts.values()), color='skyblue')
        ax.set_title('Status of Workflows')
        ax.set_xlabel('Status')
        ax.set_ylabel('Count')
        for bar in bars:
            height = bar.get_height()
            ax.annotate(f'{int(height)}',
                        xy=(bar.get_x() + bar.get_width() / 2, height),
                        xytext=(0, 3),
                        textcoords="offset points",
                        ha='center', va='bottom')

        fig.tight_layout()

        super().output(plt, fig, out_file)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Plot workflow status summary")
    parser.add_argument("--out-file", "-o", type=str, default=None, help="Optional path to save the plot image")
    parser.add_argument("--workflow-name", "-w", type=str, default=None, help="Optional workflow name (case-insensitive substring) to filter runs")
    args = parser.parse_args()
    ViewWorkflowByStatus().main(out_file=args.out_file, workflow_name=args.workflow_name)
