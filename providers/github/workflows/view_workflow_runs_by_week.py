import argparse
import matplotlib.pyplot as plt
from collections import defaultdict, OrderedDict
from datetime import datetime

from infrastructure.base_viewer import MatplotViewer
from repository_workflows import LoadWorkflows


class ViewWorkflowRunsByWeek(MatplotViewer):

    def _split_and_normalize(self, val: str):
        if not val:
            return None
        if isinstance(val, (list, tuple)):
            return [str(v).strip().lower() for v in val if v]
        return [p.strip().lower() for p in str(val).split(',') if p.strip()]

    def main(self, workflow_name: str | None = None, out_file: str | None = None, _cli_filters: dict = {}) -> None:
        """Plot number of workflow runs per week aggregated by workflow name.

        Weeks are represented as ISO year-week strings (YYYY-WW).
        """
        loader = LoadWorkflows()
        runs = loader.runs()

        # optional filter by workflow name (case-insensitive substring)
        if workflow_name:
            wf_low = workflow_name.lower()
            runs = [r for r in runs if (r.get('name') or '').lower().find(wf_low) != -1]

        # optional event filter
        if event_vals := self._split_and_normalize(_cli_filters.get('event')):
            allowed = set(event_vals)
            runs = [r for r in runs if (r.get('event') or '').lower() in allowed]

        # optional target branch filter
        if target_vals := self._split_and_normalize(_cli_filters.get('target_branch')):
            allowed = set(target_vals)
            def branch_matches(obj):
                for key in ('head_branch', 'head_ref', 'ref', 'base_ref', 'base_branch'):
                    val = (obj.get(key) or '')
                    if val and val.lower() in allowed:
                        return True
                return False
            runs = [r for r in runs if branch_matches(r)]

        print(f"Found {len(runs)} runs after filtering")

        # aggregate counts by (week, workflow_name)
        counts = defaultdict(lambda: defaultdict(int))
        weeks_set = set()
        workflow_names = set()

        for r in runs:
            name = (r.get('name') or '<unnamed>').strip()
            created = r.get('created_at') or r.get('run_started_at') or r.get('created')
            if not created:
                continue
            try:
                dt = datetime.fromisoformat(created.replace('Z', '+00:00'))
            except Exception:
                # try other common format
                try:
                    dt = datetime.strptime(created, '%Y-%m-%dT%H:%M:%SZ')
                except Exception:
                    continue

            iso_year, iso_week, _ = dt.isocalendar()
            week_key = f"{iso_year}-{iso_week:02d}"
            counts[week_key][name] += 1
            weeks_set.add(week_key)
            workflow_names.add(name)

        if not weeks_set:
            print("No weekly data to plot")
            return

        weeks = sorted(weeks_set)
        workflow_names = sorted(workflow_names)

        # build matrix of counts per workflow per week
        data_matrix = []
        for name in workflow_names:
            row = [counts[w].get(name, 0) for w in weeks]
            data_matrix.append(row)

        # stacked bar plot: weeks on x-axis, each workflow as a stacked segment
        fig, ax = plt.subplots(figsize=(max(8, len(weeks) * 0.6), 6))

        bottom = [0] * len(weeks)
        colors = plt.cm.tab20.colors
        for i, name in enumerate(workflow_names):
            vals = data_matrix[i]
            ax.bar(weeks, vals, bottom=bottom, label=name, color=colors[i % len(colors)])
            bottom = [b + v for b, v in zip(bottom, vals)]

        ax.set_xlabel('Week (YYYY-WW)')
        ax.set_ylabel('Number of runs')
        ax.set_title('Workflow runs per week by workflow name')
        ax.legend(loc='upper left', bbox_to_anchor=(1, 1))
        plt.xticks(rotation=45)
        fig.tight_layout()
        super().output(plt, fig, out_file)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Plot workflow runs per week aggregated by workflow name')
    parser.add_argument('--workflow-name', '-w', type=str, default=None, help='Optional workflow name (case-insensitive substring) to filter runs')
    parser.add_argument('--out-file', '-o', type=str, default=None, help='Optional path to save the plot image')
    parser.add_argument('--event', dest='event', type=str, default=None, help='Filter runs by event (comma-separated e.g. push,pull_request)')
    parser.add_argument('--target-branch', dest='target_branch', type=str, default=None, help='Filter runs by target branch (comma-separated)')
    args = parser.parse_args()

    _cli_filters = {'event': args.event, 'target_branch': args.target_branch}
    ViewWorkflowRunsByWeek().main(workflow_name=args.workflow_name, out_file=args.out_file, _cli_filters=_cli_filters)
