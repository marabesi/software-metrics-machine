from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from typing import List, Set


from software_metrics_machine.core.infrastructure.base_viewer import BaseViewer
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)
from software_metrics_machine.core.pipelines.pipelines_types import (
    PipelineRun,
    PipelineFilters,
)


@dataclass
class PipelineWorkflowRunsByWeekOrMonthResult:
    rep_dates: List[datetime]
    periods: List[str]
    workflow_names: Set[str]
    data_matrix: List[list[int]]
    runs: List[PipelineRun]


class PipelineWorkflowRunsByWeekOrMonth(BaseViewer):

    def __init__(self, repository: PipelinesRepository):
        self.repository: PipelinesRepository = repository

    def main(
        self,
        aggregate_by: str,
        workflow_path: str | None = None,
        raw_filters: str | None = None,
        include_defined_only: bool = False,
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> PipelineWorkflowRunsByWeekOrMonthResult:
        filters = PipelineFilters(
            **{
                "raw_filters": raw_filters,
                "start_date": start_date,
                "end_date": end_date,
                "workflow_path": workflow_path,
                "include_defined_only": include_defined_only,
            }
        )

        runs: List[PipelineRun] = self.repository.runs(filters)

        print(f"Found {len(runs)} runs after filtering")

        counts: dict[str, dict] = defaultdict(lambda: defaultdict(int))
        period_set = set()
        workflow_names: Set[str] = set()

        for r in runs:
            name = r.path
            created = r.created_at
            dt = datetime.fromisoformat(created.replace("Z", "+00:00"))

            if aggregate_by == "week":
                iso_year, iso_week, _ = dt.isocalendar()
                key = f"{iso_year}-{iso_week:02d}"
            else:
                key = dt.strftime("%Y-%m")

            counts[key][name] += 1
            period_set.add(key)
            workflow_names.add(name)

        if not period_set:
            return PipelineWorkflowRunsByWeekOrMonthResult(
                rep_dates=[],
                periods=[],
                workflow_names=set(),
                data_matrix=[],
                runs=runs,
            )

        periods = list(period_set)
        workflow_names_list = list(workflow_names)

        print(f"Plotting data aggregated by {aggregate_by}")

        # build matrix of counts per workflow per period
        data_matrix = []
        for name in workflow_names_list:
            row = [counts[p].get(name, 0) for p in periods]
            data_matrix.append(row)

        rep_dates: List[datetime] = []
        for p in periods:
            y_str, part_str = p.split("-")
            y = int(y_str)
            part = int(part_str)
            if aggregate_by == "week":
                rep = datetime.fromisocalendar(y, part, 1)
            else:
                rep = datetime(y, part, 1)
            rep_dates.append(rep)

        return PipelineWorkflowRunsByWeekOrMonthResult(
            rep_dates=rep_dates,
            periods=periods,
            workflow_names=workflow_names,
            data_matrix=data_matrix,
            runs=runs,
        )
