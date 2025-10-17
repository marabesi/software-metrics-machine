import matplotlib.pyplot as plt
from collections import Counter, defaultdict
from datetime import datetime

from core.infrastructure.base_viewer import MatplotViewer
from core.pipelines.pipelines_repository import LoadWorkflows


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

    def main(
        self,
        job_name: str,
        workflow_path: str | None = None,
        out_file: str | None = None,
        with_pipeline: bool = False,
        aggregate_by_week: bool = False,
        raw_filters: dict = {},
        start_date: str | None = None,
        end_date: str | None = None,
        force_all_jobs: bool = False,
    ) -> None:
        filters = {"start_date": start_date, "end_date": end_date}
        print(f"Applying date filter: {filters}")
        runs = self.repository.runs(filters=filters)
        jobs = self.repository.jobs(filters={**filters, "name": job_name})

        # optional filter by workflow name (case-insensitive substring match)
        if workflow_path:
            wf_low = workflow_path.lower()
            runs = [r for r in runs if (r.get("path") or "").lower().find(wf_low) != -1]

        # optional filter by event (e.g. push, pull_request) - accepts comma-separated or single value
        if event_vals := self._split_and_normalize(raw_filters.get("event")):
            allowed = set(event_vals)
            runs = [r for r in runs if (r.get("event") or "").lower() in allowed]

        if not force_all_jobs:
            # restrict jobs to only those belonging to the selected runs
            run_ids = {r.get("id") for r in runs if r.get("id") is not None}
            jobs = [j for j in jobs if j.get("run_id") in run_ids]

        print(f"Found {len(runs)} workflow runs and {len(jobs)} jobs after filtering")

        # derive display labels from job objects if possible
        display_job_name = job_name or "<job>"
        display_workflow_name = workflow_path or None
        # prefer explicit fields on job objects
        for j in jobs:
            if not display_job_name or display_job_name == "<job>":
                if j.get("name"):
                    display_job_name = j.get("name")
            if not display_workflow_name:
                wf = j.get("workflow_path") or j.get("workflow") or j.get("run_name")
                if wf:
                    display_workflow_name = wf
            if display_job_name and display_workflow_name:
                break
        # fallback: try to resolve workflow name via run_id -> run name mapping
        if not display_workflow_name:
            run_map = {r.get("id"): r.get("path") for r in runs if r.get("id")}
            for j in jobs:
                rid = j.get("run_id") or j.get("runId")
                if rid and rid in run_map:
                    display_workflow_name = run_map[rid]
                    break
        if not display_workflow_name:
            display_workflow_name = "<any>"

        # optional filter by target branch (accepts comma-separated values)
        if target_vals := self._split_and_normalize(raw_filters.get("target_branch")):
            allowed = set(target_vals)

            def branch_matches(obj):
                # check common fields that may carry branch name
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

        # left: workflow conclusions (existing)
        status_counts = Counter(run.get("conclusion") or "undefined" for run in runs)

        # right: delivery executions grouped by conclusion (day or week)
        if aggregate_by_week:
            dates, conclusions, matrix = self.count_delivery_by_week(
                jobs, job_name=job_name
            )
        else:
            dates, conclusions, matrix = self.count_delivery_by_day(
                jobs, job_name=job_name
            )

        # If with_pipeline is True show both workflow summary and job chart side-by-side
        if with_pipeline:
            fig, (ax_left, ax_right) = plt.subplots(
                1, 2, figsize=super().get_fig_size()
            )

            # plot status counts on the left axis
            bars = ax_left.bar(
                list(status_counts.keys()),
                list(status_counts.values()),
                color="skyblue",
            )

            ax_left.set_title(f"Status of Workflows - {len(runs)} runs")
            if workflow_path:
                ax_left.set_title(
                    f"Status of Workflows ({workflow_path}) - {len(runs)} runs"
                )

            ax_left.set_xlabel("Status")
            ax_left.set_ylabel("Count")
            for bar in bars:
                height = bar.get_height()
                ax_left.annotate(
                    f"{int(height)}",
                    xy=(bar.get_x() + bar.get_width() / 2, height),
                    xytext=(0, 3),
                    textcoords="offset points",
                    ha="center",
                    va="bottom",
                )

            plot_ax = ax_right
        else:
            fig, plot_ax = plt.subplots(1, 1, figsize=super().get_fig_size())

        # plot delivery executions on the chosen axis as stacked bars by conclusion
        if dates and matrix:
            # use integer x positions for stability and to allow numeric annotations
            x = list(range(len(dates)))

            # compute true totals per column (used for annotations)
            totals = [sum(row[i] for row in matrix) for i in range(len(dates))]
            max_total = max(totals) if totals else 0

            # determine a minimum visible height for any non-zero segment
            min_display = max(0.5, max(1.0, max_total) * 0.02)

            # color mapping for conclusions
            color_map = {
                "success": "#2ca02c",
                "failure": "#d62728",
                "cancelled": "#7f7f7f",
                "timed_out": "#ff7f0e",
                "unknown": "#8c564b",
                "None": "#1f77b4",
            }
            cmap = plt.get_cmap("tab20")

            display_bottoms = [0] * len(dates)
            for idx, (conc, row) in enumerate(zip(conclusions, matrix)):
                color = color_map.get(conc, cmap(idx))
                # ensure very small non-zero counts are visible by bumping them to min_display
                display_row = [
                    (v if v == 0 else (v if v >= min_display else min_display))
                    for v in row
                ]
                container = plot_ax.bar(
                    x, display_row, bottom=display_bottoms, label=conc, color=color
                )
                # label each segment with its true count (only where >0)
                try:
                    seg_labels = [str(v) if v else "" for v in row]
                    plot_ax.bar_label(
                        container, labels=seg_labels, label_type="center", fontsize=8
                    )
                except Exception:
                    pass
                display_bottoms = [b + d for b, d in zip(display_bottoms, display_row)]

            # title/xlabel depend on aggregation mode
            if aggregate_by_week:
                plot_ax.set_title(
                    f'Executions of job "{display_job_name}" in workflow "{display_workflow_name}" by week (stacked by conclusion)'  # noqa
                )
                plot_ax.set_xlabel("Week (YYYY-Www)")
            else:
                plot_ax.set_title(
                    f'Executions of job "{display_job_name}" in workflow "{display_workflow_name}" by day (stacked by conclusion)'  # noqa
                )
                plot_ax.set_xlabel("Day")

            plot_ax.set_ylabel("Executions")
            plot_ax.tick_params(axis="x", rotation=45)
            plot_ax.set_xticks(x)
            plot_ax.set_xticklabels(dates)
            plot_ax.legend(title="conclusion")

            # annotate totals on top of each stacked bar, using true totals
            offset = max(1, max(display_bottoms) * 0.02)
            for i, total in enumerate(totals):
                y = display_bottoms[i]
                plot_ax.text(i, y + offset, str(total), ha="center", va="bottom")
            # ensure y-limits provide some headroom
            plot_ax.set_ylim(
                0, max(display_bottoms) + max(1.0, max(display_bottoms) * 0.05)
            )
        else:
            plot_ax.text(
                0.5,
                0.5,
                f"No {job_name} job executions found",
                ha="center",
                va="center",
            )
            plot_ax.set_axis_off()

        fig.tight_layout()
        return super().output(plt, fig, out_file, repository=self.repository)
