import matplotlib.pyplot as plt
from collections import defaultdict
from datetime import datetime

from infrastructure.base_viewer import MatplotViewer
from providers.github.workflows.repository_workflows import LoadWorkflows


class ViewJobsByStatus(MatplotViewer):

    def __init__(self, repository: LoadWorkflows):
        self.repository = repository

    def _split_and_normalize(self, val: str):
        """Turn a comma-separated string into a list of lowercase trimmed values, or return None."""
        if not val:
            return None
        if isinstance(val, (list, tuple)):
            return [str(v).strip().lower() for v in val if v]
        return [p.strip().lower() for p in str(val).split(",") if p.strip()]

    def main(
        self,
        workflow_path: str | None = None,
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
        if start_date and end_date:
            filters = {"start_date": start_date, "end_date": end_date}
            print(f"Applying date filter: {filters}")
            runs = self.repository.runs(filters=filters)
            jobs = self.repository.jobs(filters=filters)
        else:
            runs = self.repository.runs()
            jobs = self.repository.jobs()
        # optional filter by workflow name (case-insensitive substring match)
        if workflow_path:
            wf_low = workflow_path.lower()
            runs = [r for r in runs if (r.get("path") or "").lower().find(wf_low) != -1]

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
            jobs = self.repository.filter_by_job_name(jobs, exclude)

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
            fig, plot_ax = plt.subplots(1, 1, figsize=super().get_fig_size())
            plot_ax.text(0.5, 0.5, "No job durations found", ha="center", va="center")
            plot_ax.axis("off")
            fig.tight_layout()
            super().output(plt, fig, out_file, repository=self.repository)
            return

        names, mins = zip(*averages)

        fig, plot_ax = plt.subplots(1, 1, figsize=super().get_fig_size())

        y_pos = list(range(len(names)))[::-1]
        plot_ax.barh(y_pos, mins, color="#4c78a8")
        plot_ax.set_yticks(y_pos)
        plot_ax.set_yticklabels(names)
        plot_ax.set_xlabel("Average job duration (minutes)")
        plot_ax.set_title(
            f"Top {len(names)} jobs by average duration for {len(runs)} runs - {len(jobs)} jobs"
        )
        if workflow_path:
            plot_ax.set_title(
                f"Top {len(names)} jobs by average duration for '{workflow_path}' - {len(runs)} runs - {len(jobs)} jobs"
            )

        counts_for_names = [counts.get(n, 0) for n in names]
        for i, v in enumerate(mins):
            cnt = counts_for_names[i]
            plot_ax.text(
                v + max(0.1, max(mins) * 0.01),
                y_pos[i],
                f"{v:.2f}m ({cnt})",
                va="center",
            )

        # show the sum of the averages (minutes) prominently on the plot
        try:
            total_avg = sum(mins)
            plot_ax.text(
                0.99,
                0.99,
                f"Sum of averages: {total_avg:.2f} min",
                transform=plot_ax.transAxes,
                ha="right",
                va="top",
                fontsize=9,
                bbox=dict(facecolor="white", alpha=0.6, edgecolor="none"),
            )
        except Exception:
            pass

        fig.tight_layout()
        return super().output(plt, fig, out_file, repository=self.repository)
