from unittest.mock import MagicMock, patch
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)
from software_metrics_machine.core.pipelines.plots.view_lead_time import ViewLeadTime
from tests.builders import as_json_string
from tests.deployment_frequency_builder import DeploymentFrequencyBuilder
from tests.in_memory_configuration import InMemoryConfiguration
from tests.pipeline_builder import PipelineBuilder, PipelineJobBuilder


class TestViewLeadTime:

    def test_find_commits_that_were_used_in_a_deployment_window(self):
        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string(
                    [
                        PipelineBuilder()
                        .with_id(1)
                        .with_name("Deploy")
                        .with_conclusion("success")
                        .with_created_at("2023-01-01T10:00:00Z")
                        .build(),
                    ]
                )
            if file == "jobs.json":
                return as_json_string(
                    [
                        PipelineJobBuilder()
                        .with_id(1)
                        .with_run_id(1)
                        .with_name("deploy")
                        .with_conclusion("success")
                        .with_started_at("2023-01-01T10:05:00Z")
                        .with_completed_at("2023-01-01T10:10:00Z")
                        .build(),
                    ]
                )
            return None

        with patch(
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            repository = PipelinesRepository(configuration=InMemoryConfiguration("."))
            repository.get_deployment_frequency_for_job = MagicMock(
                return_value=DeploymentFrequencyBuilder()
                .add_day("2023-10-01", count=1, commit="abcdef123")
                .add_week("2023-W39", count=1, commit="abcdef456")
                .add_month("2023-10", count=1, commit="abcdef789")
                .build()
            )
            pipeline = ".github/workflows/ci.yml"
            job = "delivery"

            lead_time_result = ViewLeadTime(repository=repository).main(
                workflow_path=pipeline, job_name=job
            )

            assert lead_time_result.data.empty
