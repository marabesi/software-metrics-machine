import argparse
import matplotlib.pyplot as plt
from collections import Counter, defaultdict
from datetime import datetime

from base_viewer import MatplotViewer
from repository_workflows import LoadWorkflows

class ViewJobsByStatus(MatplotViewer):

    def _split_and_normalize(self, val: str):
        """Turn a comma-separated string into a list of lowercase trimmed values, or return None."""
        if not val:
            return None
        if isinstance(val, (list, tuple)):
            return [str(v).strip().lower() for v in val if v]
        return [p.strip().lower() for p in str(val).split(',') if p.strip()]


    def count_delivery_by_day(self, jobs, job_name: str):
        """Return (dates, conclusions, matrix) grouping delivery job executions by day and conclusion.

        dates: list of YYYY-MM-DD strings (unknown last)
        conclusions: ordered list of conclusion keys (e.g. ['success','failure',...])
        matrix: list of rows where each row corresponds to a conclusion and contains counts per date
        """
        per_day = defaultdict(Counter)
        for j in jobs:
            name = (j.get("name") or "").strip()
            if name.lower() != job_name.lower():
                continue
            created = j.get("created_at") or j.get("started_at")
            if created:
                try:
                    dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
                    date_key = dt.date().isoformat()
                except Exception:
                    date_key = created
            else:
                date_key = "unknown"
            conclusion = (j.get("conclusion") or "unknown").lower()
            per_day[date_key][conclusion] += 1

        if not per_day:
            return [], [], []

        dates = sorted(d for d in per_day.keys() if d != "unknown")
        if "unknown" in per_day:
            dates.append("unknown")

        # determine conclusion order: prefer success, failure, then alphabetic
        all_concs = set()
        for c in per_day.values():
            all_concs.update(c.keys())
        ordered = []
        for pref in ("success", "failure"):
            if pref in all_concs:
                ordered.append(pref)
                all_concs.remove(pref)
        ordered += sorted(all_concs)

        matrix = []
        for conc in ordered:
            row = [per_day[d].get(conc, 0) for d in dates]
            matrix.append(row)

        return dates, ordered, matrix


    def count_delivery_by_week(self, jobs, job_name: str):
        """Return (weeks, conclusions, matrix) grouping job executions by ISO week and conclusion.

        weeks are strings like YYYY-Www (e.g. 2025-W35)
        """
        from collections import defaultdict, Counter

        per_week = defaultdict(Counter)
        for j in jobs:
            name = (j.get("name") or "").strip()
            if name.lower() != job_name.lower():
                continue
            created = j.get("created_at") or j.get("started_at")
            if created:
                try:
                    dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
                    week_key = f"{dt.isocalendar()[0]}-W{dt.isocalendar()[1]:02d}"
                except Exception:
                    week_key = created
            else:
                week_key = "unknown"
            conclusion = (j.get("conclusion") or "unknown").lower()
            per_week[week_key][conclusion] += 1

        if not per_week:
            return [], [], []

        weeks = sorted(w for w in per_week.keys() if w != "unknown")
        if "unknown" in per_week:
            weeks.append("unknown")

        all_concs = set()
        for cnt in per_week.values():
            all_concs.update(cnt.keys())
        ordered = []
        for pref in ("success", "failure"):
            if pref in all_concs:
                ordered.append(pref)
                all_concs.remove(pref)
        ordered += sorted(all_concs)

        matrix = []
        for concl in ordered:
            row = [per_week[w].get(concl, 0) for w in weeks]
            matrix.append(row)

        return weeks, ordered, matrix


    def main(self, job_name: str, workflow_name: str | None = None, out_file: str | None = None, with_pipeline: bool = False, aggregate_by_week: bool = False, _cli_filters: dict = {}) -> None:
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
                # check common fields that may carry branch name
                for key in ('head_branch', 'head_ref', 'ref', 'base_ref', 'base_branch'):
                    val = (obj.get(key) or '')
                    if val and val.lower() in allowed:
                        return True
                return False

            runs = [r for r in runs if branch_matches(r)]
            jobs = [j for j in jobs if branch_matches(j)]

        # left: workflow conclusions (existing)
        status_counts = Counter(run.get('conclusion') or 'None' for run in runs)

        # right: delivery executions grouped by conclusion (day or week)
        if aggregate_by_week:
            dates, conclusions, matrix = self.count_delivery_by_week(jobs, job_name=job_name)
        else:
            dates, conclusions, matrix = self.count_delivery_by_day(jobs, job_name=job_name)

        # If with_pipeline is True show both workflow summary and job chart side-by-side
        if with_pipeline:
            fig, (ax_left, ax_right) = plt.subplots(1, 2, figsize=(14, 5))

            # plot status counts on the left axis
            bars = ax_left.bar(list(status_counts.keys()), list(status_counts.values()), color='skyblue')
            ax_left.set_title('Status of Workflows')
            ax_left.set_xlabel('Status')
            ax_left.set_ylabel('Count')
            for bar in bars:
                height = bar.get_height()
                ax_left.annotate(f'{int(height)}',
                                 xy=(bar.get_x() + bar.get_width() / 2, height),
                                 xytext=(0, 3),
                                 textcoords="offset points",
                                 ha='center', va='bottom')

            plot_ax = ax_right
        else:
            fig, plot_ax = plt.subplots(1, 1, figsize=(8, 5))

        # plot delivery executions on the chosen axis as stacked bars by conclusion
        if dates and matrix:
            bottoms = [0] * len(dates)
            color_map = {
                "success": "#2ca02c",
                "failure": "#d62728",
                "cancelled": "#7f7f7f",
                "timed_out": "#ff7f0e",
                "unknown": "#8c564b",
                "None": "#1f77b4",
            }
            cmap = plt.get_cmap("tab20")
            for idx, (conc, row) in enumerate(zip(conclusions, matrix)):
                color = color_map.get(conc, cmap(idx))
                plot_ax.bar(dates, row, bottom=bottoms, label=conc, color=color)
                bottoms = [b + r for b, r in zip(bottoms, row)]

            # title/xlabel depend on aggregation mode
            if aggregate_by_week:
                plot_ax.set_title(f'Executions of job "{job_name}" by week (stacked by conclusion)')
                plot_ax.set_xlabel('Week (YYYY-Www)')
            else:
                plot_ax.set_title(f'Executions of job "{job_name}" by day (stacked by conclusion)')
                plot_ax.set_xlabel('Day')

            plot_ax.set_ylabel('Executions')
            plot_ax.tick_params(axis='x', rotation=45)
            plot_ax.legend(title='conclusion')

            # annotate totals on top of each stacked bar
            for i, total in enumerate(bottoms):
                plot_ax.text(i, total + max(1, max(bottoms) * 0.01), str(total), ha='center')
        else:
            plot_ax.text(0.5, 0.5, f'No {job_name} job executions found', ha='center', va='center')
            plot_ax.set_axis_off()

        fig.tight_layout()
        super().output(plt, fig, out_file)


if __name__ == "__main__":

    parser = argparse.ArgumentParser(description="Plot workflow/job status charts")
    parser.add_argument("--job-name", type=str, help="Job name to count/plot", required=True)
    parser.add_argument("--workflow-name", "-w", type=str, default=None, help="Optional workflow name (case-insensitive substring) to filter runs and jobs")
    parser.add_argument("--out-file", "-o", type=str, default=None, help="Optional path to save the plot image")
    parser.add_argument("--with-pipeline", type=str, help="Show workflow summary alongside job chart")
    parser.add_argument("--aggregate-by-week", dest="aggregate_by_week", action="store_true", help="Aggregate job executions by ISO week instead of day")
    parser.add_argument("--event", dest="event", type=str, default=None, help="Filter runs by event (comma-separated e.g. push,pull_request,schedule)")
    parser.add_argument("--target-branch", dest="target_branch", type=str, default=None, help="Filter runs/jobs by target branch name (comma-separated)")
    args = parser.parse_args()

    _cli_filters: dict = {}
    _cli_filters['event'] = args.event
    _cli_filters['target_branch'] = args.target_branch


    ViewJobsByStatus().main(
        job_name=args.job_name,
        workflow_name=args.workflow_name,
        out_file=args.out_file,
        with_pipeline=args.with_pipeline,
        aggregate_by_week=args.aggregate_by_week,
        _cli_filters=_cli_filters,
    )
