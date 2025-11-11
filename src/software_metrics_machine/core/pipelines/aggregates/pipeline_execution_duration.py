from dataclasses import dataclass
from typing import List
from software_metrics_machine.core.infrastructure.base_viewer import BaseViewer
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)


@dataclass
class PipelineExecutionDurationResult:
    names: List[str]
    values: List[float]
    counts: List[int]
    ylabel: str
    title_metric: str
    rows: List[List]


class PipelineExecutionDuration(BaseViewer):
    def __init__(self, repository: PipelinesRepository):
        self.repository = repository

    def main(
        self,
        workflow_path: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
        max_runs: int = 50,
        metric: str = "avg",
        sort_by: str = "avg",
        raw_filters: str | None = None,
    ) -> PipelineExecutionDurationResult:
        filters = {
            "start_date": start_date,
            "end_date": end_date,
            "workflow_path": workflow_path,
        }

        if raw_filters:
            filters = {**filters, **self.repository.parse_raw_filters(raw_filters)}

        data = self.repository.get_workflows_run_duration(filters)

        print(f"Found {data["total"]} runs after filtering")

        rows = data["rows"]

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

        return PipelineExecutionDurationResult(
            names=names,
            values=values,
            counts=counts,
            ylabel=ylabel,
            title_metric=title_metric,
            rows=rows,
        )
