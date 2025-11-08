from collections import Counter
from dataclasses import dataclass
from typing import List

from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)
from software_metrics_machine.core.pipelines.pipelines_types import PipelineRun


@dataclass
class PipelineByStatusResult:
    status_counts: Counter
    runs: List[PipelineRun]


class PipelineByStatus:
    def __init__(self, repository: PipelinesRepository):
        self.repository = repository

    def main(
        self,
        workflow_path: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
        target_branch: str | None = None,
    ) -> None:
        filters = {
            "start_date": start_date,
            "end_date": end_date,
            "path": workflow_path,
            "target_branch": target_branch,
        }
        runs = self.repository.runs(filters)

        status_counts = Counter(run.get("status") or "undefined" for run in runs)

        print(f"Total workflow runs after filters: {len(runs)}")
        return PipelineByStatusResult(
            status_counts=status_counts,
            runs=runs,
        )
