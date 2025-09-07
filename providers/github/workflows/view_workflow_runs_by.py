import argparse
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from collections import defaultdict
from datetime import datetime

from infrastructure.base_viewer import MatplotViewer
from repository_workflows import LoadWorkflows


class ViewWorkflowRunsBy(MatplotViewer):

    def main(
        self,
        workflow_name: str | None = None,
        out_file: str | None = None,
        raw_filters: dict = {},
        include_defined_only: bool = False,
        aggregate_by: str = "week",
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> None:
        loader = LoadWorkflows()
        if start_date and end_date:
            filters = {"start_date": start_date, "end_date": end_date}
            print(f"Applying date filter: {filters}")
            runs = loader.runs(filters)
        else:
            runs = loader.runs()

        # optional filter by workflow name (case-insensitive substring)
        if workflow_name:
            wf_low = workflow_name.lower()
            runs = [r for r in runs if (r.get("name") or "").lower().find(wf_low) != -1]

        # optional event filter
        if event_vals := self._split_and_normalize(raw_filters.get("event")):
            allowed = set(event_vals)
            runs = [r for r in runs if (r.get("event") or "").lower() in allowed]

        # optional target branch filter
        if target_vals := self._split_and_normalize(raw_filters.get("target_branch")):
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

        # optional include-defined-only filter: keep only workflows whose defined file ends with .yml
        if include_defined_only:

            def is_defined_yaml(run_obj: dict) -> bool:
                path = (
                    run_obj.get("path")
                    or run_obj.get("workflow_path")
                    or run_obj.get("file")
                    or ""
                )
                if isinstance(path, str) and (
                    path.strip().lower().endswith(".yml")
                    or path.strip().lower().endswith(".yaml")
                ):
                    return True
                name = run_obj.get("name") or ""
                return isinstance(name, str) and name.strip().lower().endswith(".yml")

            runs = [r for r in runs if is_defined_yaml(r)]

        print(f"Found {len(runs)} runs after filtering")

        # aggregate counts by (period_key, workflow_name)
        counts = defaultdict(lambda: defaultdict(int))
        period_set = set()
        workflow_names = set()

        for r in runs:
            name = (r.get("name") or "<unnamed>").strip()
            created = r.get("created_at") or r.get("run_started_at") or r.get("created")
            if not created:
                continue
            try:
                dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
            except Exception:
                try:
                    dt = datetime.strptime(created, "%Y-%m-%dT%H:%M:%SZ")
                except Exception:
                    continue

            if aggregate_by == "week":
                iso_year, iso_week, _ = dt.isocalendar()
                key = f"{iso_year}-{iso_week:02d}"
            else:
                key = dt.strftime("%Y-%m")

            counts[key][name] += 1
            period_set.add(key)
            workflow_names.add(name)

        if not period_set:
            print("No data to plot")
            return

        periods = sorted(period_set)
        workflow_names = sorted(workflow_names)

        # build matrix of counts per workflow per period
        data_matrix = []
        for name in workflow_names:
            row = [counts[p].get(name, 0) for p in periods]
            data_matrix.append(row)

        # representative datetime for each period
        rep_dates = []
        for p in periods:
            try:
                y_str, part_str = p.split("-")
                y = int(y_str)
                part = int(part_str)
                if aggregate_by == "week":
                    rep = datetime.fromisocalendar(y, part, 1)
                else:
                    rep = datetime(y, part, 1)
            except Exception:
                rep = None
            rep_dates.append(rep)

        x_vals = mdates.date2num(rep_dates)

        # plotting
        fig, ax = plt.subplots(figsize=(max(8, len(periods) * 0.6), 6))
        bottom = [0] * len(periods)
        colors = plt.cm.tab20.colors
        bar_width = 6.5 if aggregate_by == "week" else 20

        for i, name in enumerate(workflow_names):
            vals = data_matrix[i]
            cont = ax.bar(
                x_vals,
                vals,
                bottom=bottom,
                label=name,
                color=colors[i % len(colors)],
                width=bar_width,
                align="center",
            )
            try:
                labels = [str(v) if v else "" for v in vals]
                ax.bar_label(cont, labels=labels, label_type="center", fontsize=8)
            except Exception:
                pass
            bottom = [b + v for b, v in zip(bottom, vals)]

        ax.set_xlabel("Week (YYYY-WW)" if aggregate_by == "week" else "Month (YYYY-MM)")
        ax.set_ylabel("Number of runs")
        ax.set_title(
            "Workflow runs per %s by workflow name (%d in total)"
            % ("week" if aggregate_by == "week" else "month", len(runs))
        )
        ax.legend(loc="upper left", bbox_to_anchor=(1, 1))

        # draw separators where month changes
        months = [d.month for d in rep_dates]
        month_change_idxs = [
            i for i in range(1, len(months)) if months[i] != months[i - 1]
        ]
        for idx in month_change_idxs:
            xline = (x_vals[idx - 1] + x_vals[idx]) / 2.0
            ax.axvline(x=xline, color="0.7", linestyle="--", linewidth=0.8)

        # tick labels
        tick_labels = []
        for p, d in zip(periods, rep_dates):
            if d:
                month = d.strftime("%b %Y")
            else:
                month = ""
            if aggregate_by == "week":
                tick_labels.append(f"{p}\n{month}")
            else:
                tick_labels.append(month)

        ax.set_xticks(x_vals)
        ax.set_xticklabels(tick_labels)
        plt.xticks(rotation=45)
        ax.set_xlim(min(x_vals) - 2, max(x_vals) + 2)
        fig.tight_layout()
        super().output(plt, fig, out_file)

    def _split_and_normalize(self, val: str):
        if not val:
            return None
        if isinstance(val, (list, tuple)):
            return [str(v).strip().lower() for v in val if v]
        return [p.strip().lower() for p in str(val).split(",") if p.strip()]


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Plot workflow runs per week aggregated by workflow name"
    )
    parser.add_argument(
        "--workflow-name",
        "-w",
        type=str,
        default=None,
        help="Optional workflow name (case-insensitive substring) to filter runs",
    )
    parser.add_argument(
        "--out-file",
        "-o",
        type=str,
        default=None,
        help="Optional path to save the plot image",
    )
    parser.add_argument(
        "--event",
        dest="event",
        type=str,
        default=None,
        help="Filter runs by event (comma-separated e.g. push,pull_request)",
    )
    parser.add_argument(
        "--target-branch",
        dest="target_branch",
        type=str,
        default=None,
        help="Filter runs by target branch (comma-separated)",
    )
    parser.add_argument(
        "--include-defined-only",
        dest="include_defined_only",
        help="If set, include only workflows that are defined as .yml or .yaml",
    )
    parser.add_argument(
        "--aggregate-by",
        dest="aggregate_by",
        choices=["week", "month"],
        default="week",
        help="Aggregate the data by 'week' (default) or 'month'",
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

    ViewWorkflowRunsBy().main(
        workflow_name=args.workflow_name,
        out_file=args.out_file,
        raw_filters={"event": args.event, "target_branch": args.target_branch},
        include_defined_only=args.include_defined_only,
        aggregate_by=args.aggregate_by,
        start_date=args.start_date,
        end_date=args.end_date,
    )
