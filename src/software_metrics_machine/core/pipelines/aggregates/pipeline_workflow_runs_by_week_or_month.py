from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from typing import List


from software_metrics_machine.core.infrastructure.base_viewer import BaseViewer
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)
from software_metrics_machine.core.pipelines.pipelines_types import PipelineRun


@dataclass
class PipelineWorkflowRunsByWeekOrMonthResult:
    rep_dates: List[datetime | None]
    periods: List[str]
    workflow_names: List[str]
    data_matrix: List[list[int]]
    runs: List[PipelineRun]


class PipelineWorkflowRunsByWekOrMonth(BaseViewer):

    def __init__(self, repository: PipelinesRepository):
        self.repository = repository

    def main(
        self,
        aggregate_by: str,
        workflow_path: str | None = None,
        raw_filters: str | None = None,
        include_defined_only: bool = False,
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> PipelineWorkflowRunsByWeekOrMonthResult:
        params = self.repository.parse_raw_filters(raw_filters)
        event = params.get("event")
        status = params.get("status")
        target_branch = params.get("target_branch")
        conclusion = params.get("conclusion")

        filters = {
            "start_date": start_date,
            "end_date": end_date,
            "event": event,
            "target_branch": target_branch,
            "workflow_path": workflow_path,
            "include_defined_only": include_defined_only,
            "conclusion": conclusion,
            "status": status,
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
            return PipelineWorkflowRunsByWeekOrMonthResult(
                rep_dates=[],
                periods=[],
                workflow_names=[],
                data_matrix=[],
                runs=runs,
            )

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

        return PipelineWorkflowRunsByWeekOrMonthResult(
            rep_dates=rep_dates,
            periods=periods,
            workflow_names=workflow_names,
            data_matrix=data_matrix,
            runs=runs,
        )
