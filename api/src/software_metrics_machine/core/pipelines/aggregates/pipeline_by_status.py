from collections import Counter

from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)
from software_metrics_machine.core.pipelines.pipelines_types import (
    PipelineFilters,
    PipelineByStatusResult,
)


class PipelineByStatus:
    def __init__(self, repository: PipelinesRepository):
        self.repository: PipelinesRepository = repository

    def main(
        self,
        workflow_path: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
        target_branch: str | None = None,
        raw_filters: str | None = None,
    ) -> PipelineByStatusResult:
        filters: dict = {
            "start_date": start_date,
            "end_date": end_date,
            "path": workflow_path,
            "target_branch": target_branch,
            "raw_filters": raw_filters,
        }
        runs = self.repository.runs(PipelineFilters(**filters))

        status_counts = Counter(run.status for run in runs)

        print(f"Total workflow runs after filters: {len(runs)}")
        return PipelineByStatusResult(
            status_counts=status_counts,
            runs=runs,
        )
