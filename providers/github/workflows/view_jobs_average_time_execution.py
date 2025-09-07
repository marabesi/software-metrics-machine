import argparse
import matplotlib.pyplot as plt
from collections import defaultdict
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
        return [p.strip().lower() for p in str(val).split(",") if p.strip()]

    def main(
        self,
        workflow_name: str | None = None,
        out_file: str | None = None,
        _cli_filters: dict = {},
        top: int = 20,
        exclude_jobs: str = None,
        start_date: str | None = None,
        end_date: str | None = None,
        force_all_jobs: bool = False,
    ) -> None:
        """Compute average job execution time (completed_at - started_at) grouped by job name and plot top-N.

        Averages are shown in minutes.
        """
        workflows = LoadWorkflows()
        if start_date and end_date:
            filters = {"start_date": start_date, "end_date": end_date}
            print(f"Applying date filter: {filters}")
            runs = workflows.runs(filters=filters)
            jobs = workflows.jobs(filters=filters)
        else:
            runs = workflows.runs()
            jobs = workflows.jobs()
        # optional filter by workflow name (case-insensitive substring match)
        if workflow_name:
            wf_low = workflow_name.lower()
            runs = [r for r in runs if (r.get("name") or "").lower().find(wf_low) != -1]

        # optional filter by event (e.g. push, pull_request) - accepts comma-separated or single value
        if event_vals := self._split_and_normalize(_cli_filters.get("event")):
            allowed = set(event_vals)
            runs = [r for r in runs if (r.get("event") or "").lower() in allowed]

        if not force_all_jobs:
            # restrict jobs to only those belonging to the selected runs
            run_ids = {r.get("id") for r in runs if r.get("id") is not None}
            jobs = [j for j in jobs if j.get("run_id") in run_ids]

        # optional filter by target branch (accepts comma-separated values)
        if target_vals := self._split_and_normalize(_cli_filters.get("target_branch")):
            allowed = set(target_vals)

            def branch_matches(obj):
                for key in (
                    "head_branch",
                    "head_ref",
                    "ref",
                    "base_ref",
                    "base_branch",
                ):
                    val = obj.get(key) or ""
                    if val and val.lower() in allowed:
                        return True
                return False

            runs = [r for r in runs if branch_matches(r)]
            jobs = [j for j in jobs if branch_matches(j)]

        if exclude_jobs:
            exclude = [s.strip() for s in exclude_jobs.split(",") if s.strip()]
            jobs = workflows.filter_by_job_name(jobs, exclude)

        print(f"Found {len(runs)} workflow runs and {len(jobs)} jobs after filtering")

        # aggregate durations by job name
        sums = defaultdict(float)
        counts = defaultdict(int)
        for job in jobs:
            name = (job.get("name") or "").strip() or "<unnamed>"
            started = job.get("started_at") or job.get("created_at")
            completed = job.get("completed_at")
            if not started or not completed:
                continue
            try:
                dt_start = datetime.fromisoformat(started.replace("Z", "+00:00"))
                dt_end = datetime.fromisoformat(completed.replace("Z", "+00:00"))
            except Exception:
                continue
            secs = (dt_end - dt_start).total_seconds()
            if secs < 0:
                # ignore negative durations
                continue
            sums[name] += secs
            counts[name] += 1

        averages = [
            (name, (sums[name] / counts[name]) / 60.0) for name in counts.keys()
        ]  # minutes
        # sort by average descending (longest first)
        averages.sort(key=lambda x: x[1], reverse=True)
        averages = averages[:top]

        if not averages:
            print("No job durations found after filtering")
            fig, plot_ax = plt.subplots(1, 1, figsize=(10, 4))
            plot_ax.text(0.5, 0.5, "No job durations found", ha="center", va="center")
            plot_ax.axis("off")
            fig.tight_layout()
            super().output(plt, fig, out_file)
            return

        names, mins = zip(*averages)

        fig, plot_ax = plt.subplots(1, 1, figsize=(10, max(4, len(names) * 0.5)))

        y_pos = list(range(len(names)))[::-1]
        plot_ax.barh(y_pos, mins, color="#4c78a8")
        plot_ax.set_yticks(y_pos)
        plot_ax.set_yticklabels(names)
        plot_ax.set_xlabel("Average job duration (minutes)")
        plot_ax.set_title(f"Top {len(names)} job names by average duration")
        if workflow_name:
            plot_ax.set_title(
                f"Top {len(names)} job names by average duration for '{workflow_name}'"
            )

        for i, v in enumerate(mins):
            plot_ax.text(
                v + max(0.1, max(mins) * 0.01), y_pos[i], f"{v:.2f}", va="center"
            )

        fig.tight_layout()
        super().output(plt, fig, out_file)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Plot average job execution time by job name"
    )
    parser.add_argument(
        "--workflow-name",
        "-w",
        type=str,
        default=None,
        help="Optional workflow name (case-insensitive substring) to filter runs and jobs",
    )
    parser.add_argument(
        "--out-file",
        "-o",
        type=str,
        default=None,
        help="Optional path to save the plot image",
    )
    parser.add_argument(
        "--top", type=int, default=20, help="How many top job names to show"
    )
    parser.add_argument(
        "--event",
        dest="event",
        type=str,
        default=None,
        help="Filter runs by event (comma-separated e.g. push,pull_request,schedule)",
    )
    parser.add_argument(
        "--target-branch",
        dest="target_branch",
        type=str,
        default=None,
        help="Filter jobs by target branch name (comma-separated)",
    )
    parser.add_argument(
        "--exclude-jobs",
        dest="exclude_jobs",
        type=str,
        default=None,
        help="Removes jobs that contain the name from the chart (comma-separated)",
    )
    parser.add_argument(
        "--start-date",
        type=str,
        help="Start date (inclusive) in YYYY-MM-DD",
    )
    parser.add_argument(
        "--end-date", type=str, help="End date (inclusive) in YYYY-MM-DD"
    )
    parser.add_argument(
        "--force-all-jobs",
        type=bool,
        default=False,
        help="include setup jobs used by GitHub actions, such as 'Set up job' or 'Checkout code'",
    )
    args = parser.parse_args()

    _cli_filters = {"event": args.event, "target_branch": args.target_branch}

    ViewJobsByStatus().main(
        workflow_name=args.workflow_name,
        out_file=args.out_file,
        _cli_filters=_cli_filters,
        top=args.top,
        exclude_jobs=args.exclude_jobs,
        start_date=args.start_date,
        end_date=args.end_date,
        force_all_jobs=args.force_all_jobs,
    )
