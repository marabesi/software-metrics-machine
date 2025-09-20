import argparse
import matplotlib.pyplot as plt
from datetime import datetime
from typing import List

from infrastructure.base_viewer import MatplotViewer
from providers.github.workflows.repository_workflows import LoadWorkflows


def _parse_dt(v: str):
    if not v:
        return None
    try:
        return datetime.fromisoformat(v.replace("Z", "+00:00"))
    except Exception:
        try:
            return datetime.strptime(v, "%Y-%m-%dT%H:%M:%SZ")
        except Exception:
            return None


class ViewRunsDuration(MatplotViewer):
    def main(
        self,
        out_file: str | None = None,
        workflow_name: List[str] | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
        max_runs: int = 50,
        metric: str = "avg",
        sort_by: str = "avg",
    ) -> None:
        loader = LoadWorkflows()
        if start_date and end_date:
            filters = {"start_date": start_date, "end_date": end_date}
            runs = loader.runs(filters)
        else:
            runs = loader.runs()

        if workflow_name:
            # normalize provided list of names
            name_tokens = [n.strip().lower() for n in workflow_name if n]

            def matches_any(name: str) -> bool:
                nl = (name or "").lower()
                return any(tok == nl for tok in name_tokens)

            runs = [r for r in runs if matches_any(r.get("name") or "")]

        # group durations by run name
        groups = {}
        for r in runs:
            name = r.get("name") or "<unnamed>"
            start = (
                r.get("run_started_at") or r.get("created_at") or r.get("started_at")
            )
            end = r.get("updated_at") or r.get("completed_at") or r.get("ended_at")
            sdt = _parse_dt(start)
            edt = _parse_dt(end)
            if not sdt:
                continue
            if edt:
                dur = (edt - sdt).total_seconds()
            else:
                dur = None
            groups.setdefault(name, []).append(dur)

        if not groups:
            print("No runs with start timestamps to aggregate")
            return

        # compute aggregated metrics per group
        rows = []  # (name, count, avg_min, total_min)
        for name, durs in groups.items():
            # consider only durations that are not None
            valid = [d for d in durs if d is not None and d > 0]
            count = len(durs)
            total = sum(valid) if valid else 0.0
            avg = (total / len(valid)) if valid else 0.0
            rows.append((name, count, avg / 60.0, total / 60.0))

        # choose sort key
        sort_key = {
            "avg": lambda r: r[2],
            "sum": lambda r: r[3],
            "count": lambda r: r[1],
        }.get(sort_by, lambda r: r[2])

        rows.sort(key=sort_key, reverse=True)
        rows = rows[:max_runs]

        names = [r[0] for r in rows]
        counts = [r[1] for r in rows]
        avgs = [r[2] for r in rows]
        sums = [r[3] for r in rows]

        # pick metric to plot
        if metric == "sum":
            values = sums
            ylabel = "Total minutes"
            title_metric = "Total"
        elif metric == "count":
            values = counts
            ylabel = "Count"
            title_metric = "Count"
        else:
            values = avgs
            ylabel = "Average minutes"
            title_metric = "Average"

        fig, ax = plt.subplots(figsize=(max(8, len(names) * 0.4), 6))
        x = list(range(len(names)))
        bars = ax.bar(x, values, color="tab:blue")

        # annotate bars with counts and exact values
        for i, bar in enumerate(bars):
            v = values[i]
            cnt = counts[i]
            ax.text(
                bar.get_x() + bar.get_width() / 2,
                v + max(0.1, max(values) * 0.01),
                f"{v:.1f}",
                ha="center",
                va="bottom",
                fontsize=8,
            )
            ax.text(
                bar.get_x() + bar.get_width() / 2,
                max(0.01, v * 0.02),
                f"n={cnt}",
                ha="center",
                va="bottom",
                fontsize=7,
                color="white",
            )

        ax.set_xticks(x)
        ax.set_xticklabels(names, rotation=45, ha="right")
        ax.set_ylabel(ylabel)
        ax.set_title(f"Runs aggregated by name - {title_metric} ({len(rows)} items)")
        fig.tight_layout()

        return super().output(plt, fig, out_file)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Plot runs as durations (Gantt-like)")
    parser.add_argument("--out-file", "-o", type=str, default=None)
    parser.add_argument(
        "--workflow-name",
        "-w",
        action="append",
        help="Workflow name (exact match, case-insensitive). Can be repeated or supply comma-separated values.",
    )
    parser.add_argument("--start-date", type=str, default=None)
    parser.add_argument("--end-date", type=str, default=None)
    parser.add_argument("--max-runs", type=int, default=100)
    args = parser.parse_args()

    # normalize workflow name argument into a list (split comma-separated values)
    wf_names = None
    if args.workflow_name:
        wf_names = []
        for item in args.workflow_name:
            parts = [p.strip() for p in item.split(",") if p.strip()]
            wf_names.extend(parts)

    ViewRunsDuration().main(
        out_file=args.out_file,
        workflow_name=wf_names,
        start_date=args.start_date,
        end_date=args.end_date,
        max_runs=args.max_runs,
    )
