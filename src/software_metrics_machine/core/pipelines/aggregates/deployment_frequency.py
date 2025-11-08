from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)
from software_metrics_machine.core.pipelines.pipelines_types import (
    DeploymentFrequency as DeploymentFrequencyType,
)


class DeploymentFrequency:
    def __init__(self, repository: PipelinesRepository):
        self.repository = repository

    def execute(
        self,
        workflow_path: str,
        job_name: str,
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> DeploymentFrequencyType:
        filters = {
            "start_date": start_date,
            "end_date": end_date,
            "path": workflow_path,
        }
        runs = self.repository.runs(filters)

        print(f"Filtered to {len(runs)} runs after applying workflow path filter")

        return self.repository.get_deployment_frequency_for_job(
            job_name=job_name, filters=filters
        )
