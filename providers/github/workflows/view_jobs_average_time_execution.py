import argparse
import matplotlib.pyplot as plt
from collections import defaultdict, Counter
from datetime import datetime

from infrastructure.base_viewer import MatplotViewer
from repository_workflows import LoadWorkflows


class ViewJobsByStatus(MatplotViewer):

    def _split_and_normalize(self, val: str):
        """Turn a comma-separated string into a list of lowercase trimmed values, or return None."""
        if not val:
            return None
        if isinstance(val, (list, tuple)):
            return [str(v).strip().lower() for v in val if v]
        return [p.strip().lower() for p in str(val).split(',') if p.strip()]


    def main(self, workflow_name: str | None = None, out_file: str | None = None, _cli_filters: dict = {}, top: int = 20) -> None:
        """Compute average job execution time (completed_at - started_at) grouped by job name and plot top-N.

        Averages are shown in minutes.
        """
        workflows = LoadWorkflows()
        runs = workflows.runs()
        jobs = workflows.jobs()

        # optional filter by workflow name (case-insensitive substring match)
        if workflow_name:
            wf_low = workflow_name.lower()
            runs = [r for r in runs if (r.get('name') or '').lower().find(wf_low) != -1]

        # optional filter by event (e.g. push, pull_request) - accepts comma-separated or single value
        if event_vals := self._split_and_normalize(_cli_filters.get('event')):
            allowed = set(event_vals)
            runs = [r for r in runs if (r.get('event') or '').lower() in allowed]

        # restrict jobs to only those belonging to the selected runs
        run_ids = {r.get('id') for r in runs if r.get('id') is not None}
        jobs = [j for j in jobs if j.get('run_id') in run_ids]

        print(f"Found {len(runs)} workflow runs and {len(jobs)} jobs after filtering")

        # optional filter by target branch (accepts comma-separated values)
        if target_vals := self._split_and_normalize(_cli_filters.get('target_branch')):
            allowed = set(target_vals)
            def branch_matches(obj):
                for key in ('head_branch', 'head_ref', 'ref', 'base_ref', 'base_branch'):
                    val = (obj.get(key) or '')
                    if val and val.lower() in allowed:
                        return True
                return False

            runs = [r for r in runs if branch_matches(r)]
            jobs = [j for j in jobs if branch_matches(j)]

        # aggregate durations by job name
        sums = defaultdict(float)
        counts = defaultdict(int)
        for job in jobs:
            name = (job.get('name') or '').strip() or '<unnamed>'
            started = job.get('started_at') or job.get('created_at')
            completed = job.get('completed_at')
            if not started or not completed:
                continue
            try:
                dt_start = datetime.fromisoformat(started.replace('Z', '+00:00'))
                dt_end = datetime.fromisoformat(completed.replace('Z', '+00:00'))
            except Exception:
                continue
            secs = (dt_end - dt_start).total_seconds()
            if secs < 0:
                # ignore negative durations
                continue
            sums[name] += secs
            counts[name] += 1

        # prepare status summary (useful if plotting pipeline summary)
        status_counts = Counter(r.get('conclusion') or 'None' for r in runs)

        if not counts:
            print('No completed jobs with timestamps to compute averages')
            # show only workflow status summary
            fig, ax = plt.subplots(1, 1, figsize=(8, 5))
            bars = ax.bar(list(status_counts.keys()), list(status_counts.values()), color='skyblue')
            ax.set_title('Status of Workflows')
            ax.set_xlabel('Status')
            ax.set_ylabel('Count')
            for bar in bars:
                h = bar.get_height()
                ax.annotate(f'{int(h)}', xy=(bar.get_x() + bar.get_width() / 2, h), xytext=(0, 3), textcoords='offset points', ha='center', va='bottom')
            fig.tight_layout()
            super().output(plt, fig, out_file)
            return

        averages = [(name, (sums[name] / counts[name]) / 60.0) for name in counts.keys()]  # minutes
        # sort by average descending (longest first)
        averages.sort(key=lambda x: x[1], reverse=True)
        averages = averages[:top]

        names, mins = zip(*averages)

        fig, plot_ax = plt.subplots(1, 1, figsize=(10, max(4, len(names) * 0.5)))

        y_pos = list(range(len(names)))[::-1]
        plot_ax.barh(y_pos, mins, color='#4c78a8')
        plot_ax.set_yticks(y_pos)
        plot_ax.set_yticklabels(names)
        plot_ax.set_xlabel('Average job duration (minutes)')
        plot_ax.set_title(f'Top {len(names)} job names by average duration')
        for i, v in enumerate(mins):
            plot_ax.text(v + max(0.1, max(mins) * 0.01), y_pos[i], f"{v:.2f}", va='center')

        fig.tight_layout()
        super().output(plt, fig, out_file)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Plot average job execution time by job name')
    parser.add_argument('--workflow-name', '-w', type=str, default=None, help='Optional workflow name (case-insensitive substring) to filter runs and jobs')
    parser.add_argument('--out-file', '-o', type=str, default=None, help='Optional path to save the plot image')
    parser.add_argument('--top', type=int, default=20, help='How many top job names to show')
    parser.add_argument('--event', dest='event', type=str, default=None, help='Filter runs by event (comma-separated e.g. push,pull_request,schedule)')
    parser.add_argument('--target-branch', dest='target_branch', type=str, default=None, help='Filter runs/jobs by target branch name (comma-separated)')
    args = parser.parse_args()

    _cli_filters = {'event': args.event, 'target_branch': args.target_branch}

    ViewJobsByStatus().main(
        workflow_name=args.workflow_name,
        out_file=args.out_file,
        _cli_filters=_cli_filters,
        top=args.top,
    )
