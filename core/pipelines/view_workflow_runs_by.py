import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from collections import defaultdict
from datetime import datetime

from core.infrastructure.base_viewer import MatplotViewer
from providers.github.workflows.repository_workflows import LoadWorkflows


class ViewWorkflowRunsBy(MatplotViewer):

    def __init__(self, repository: LoadWorkflows):
        self.repository = repository

    def main(
        self,
        aggregate_by: str,
        workflow_path: str | None = None,
        out_file: str | None = None,
        raw_filters: str | None = None,
        include_defined_only: bool = False,
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> None:
        params = self.repository.parse_raw_filters(raw_filters)
        event = params.get("event")
        target_branch = params.get("target_branch")

        filters = {
            "start_date": start_date,
            "end_date": end_date,
            "event": event,
            "target_branch": target_branch,
            "workflow_path": workflow_path,
            "include_defined_only": include_defined_only,
        }

        runs = self.repository.runs(filters)

        print(f"Found {len(runs)} runs after filtering")

        counts = defaultdict(lambda: defaultdict(int))
        period_set = set()
        workflow_names = set()

        for r in runs:
            name = (r.get("path") or "<unnamed>").strip()
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

        print(f"Plotting data aggregated by {aggregate_by}")

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
        fig, ax = plt.subplots(
            figsize=super().get_fig_size()
        )  # Ensure a consistent width for better readability
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

        months = [d.month for d in rep_dates]
        month_change_idxs = [
            i for i in range(1, len(months)) if months[i] != months[i - 1]
        ]
        for idx in month_change_idxs:
            xline = (x_vals[idx - 1] + x_vals[idx]) / 2.0
            ax.axvline(x=xline, color="0.7", linestyle="--", linewidth=0.8)

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
        return super().output(plt, fig, out_file, repository=self.repository)
