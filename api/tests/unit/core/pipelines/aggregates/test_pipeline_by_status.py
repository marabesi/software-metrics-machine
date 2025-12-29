from unittest.mock import patch
from software_metrics_machine.core.pipelines.aggregates.pipeline_by_status import (
    PipelineByStatus,
)
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)
from tests.builders import as_json_string
from tests.in_memory_configuration import InMemoryConfiguration
from tests.pipeline_builder import PipelineBuilder


class TestPipelineByStatus:

    def test_empty_runs(self):
        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string([])
            if file == "jobs.json":
                return as_json_string([])
            return None

        with patch(
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            repository = PipelinesRepository(configuration=InMemoryConfiguration("."))
            pipeline_status = PipelineByStatus(repository=repository)

            result = pipeline_status.main()

            # Verify empty result structure
            assert result.status_counts == {}
            assert result.runs == []

    def test_runs_with_various_statuses(self):
        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string(
                    [
                        PipelineBuilder()
                        .with_id(1)
                        .with_name("CI")
                        .with_path("/workflows/ci.yml")
                        .with_status("completed")
                        .with_created_at("2023-01-01T10:00:00Z")
                        .build(),
                        PipelineBuilder()
                        .with_id(2)
                        .with_name("Build")
                        .with_path("/workflows/build.yml")
                        .with_status("completed")
                        .with_created_at("2023-01-02T10:00:00Z")
                        .build(),
                        PipelineBuilder()
                        .with_id(3)
                        .with_name("Deploy")
                        .with_path("/workflows/deploy.yml")
                        .with_status("in_progress")
                        .with_created_at("2023-01-03T10:00:00Z")
                        .build(),
                        PipelineBuilder()
                        .with_id(4)
                        .with_name("Test")
                        .with_path("/workflows/test.yml")
                        .with_status("queued")
                        .with_created_at("2023-01-04T10:00:00Z")
                        .build(),
                    ]
                )
            if file == "jobs.json":
                return as_json_string([])
            return None

        with patch(
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            repository = PipelinesRepository(configuration=InMemoryConfiguration("."))
            pipeline_status = PipelineByStatus(repository=repository)

            result = pipeline_status.main()

            # Verify status counts
            assert result.status_counts["completed"] == 2
            assert result.status_counts["in_progress"] == 1
            assert result.status_counts["queued"] == 1

            # Verify all runs are included
            assert len(result.runs) == 4

    def test_runs_with_workflow_path_filter(self):
        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string(
                    [
                        PipelineBuilder()
                        .with_id(1)
                        .with_name("CI")
                        .with_path("/workflows/ci.yml")
                        .with_status("completed")
                        .with_created_at("2023-01-01T10:00:00Z")
                        .build(),
                        PipelineBuilder()
                        .with_id(2)
                        .with_name("Build")
                        .with_path("/workflows/build.yml")
                        .with_status("completed")
                        .with_created_at("2023-01-02T10:00:00Z")
                        .build(),
                        PipelineBuilder()
                        .with_id(3)
                        .with_name("Deploy")
                        .with_path("/workflows/deploy.yml")
                        .with_status("in_progress")
                        .with_created_at("2023-01-03T10:00:00Z")
                        .build(),
                    ]
                )
            if file == "jobs.json":
                return as_json_string([])
            return None

        with patch(
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            repository = PipelinesRepository(configuration=InMemoryConfiguration("."))
            pipeline_status = PipelineByStatus(repository=repository)

            # Filter by workflow path
            result = pipeline_status.main(workflow_path="/workflows/ci.yml")

            # Should only include CI workflow
            assert len(result.runs) == 1
            assert result.runs[0].path == "/workflows/ci.yml"
            assert result.status_counts["completed"] == 1
