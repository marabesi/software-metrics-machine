from unittest.mock import patch
from software_metrics_machine.core.pipelines.aggregates.pipeline_by_status import (
    PipelineByStatus,
)
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)
from tests.builders import as_json_string
from tests.in_memory_configuration import InMemoryConfiguration


class TestPipelineByStatus:

    def test_empty_runs(self):
        """Test main() with empty runs."""

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
        """Test main() with runs having different statuses."""

        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string(
                    [
                        {
                            "id": 1,
                            "name": "CI",
                            "path": "/workflows/ci.yml",
                            "status": "completed",
                            "created_at": "2023-01-01T10:00:00Z",
                        },
                        {
                            "id": 2,
                            "name": "Build",
                            "path": "/workflows/build.yml",
                            "status": "completed",
                            "created_at": "2023-01-02T10:00:00Z",
                        },
                        {
                            "id": 3,
                            "name": "Deploy",
                            "path": "/workflows/deploy.yml",
                            "status": "in_progress",
                            "created_at": "2023-01-03T10:00:00Z",
                        },
                        {
                            "id": 4,
                            "name": "Test",
                            "path": "/workflows/test.yml",
                            "status": "queued",
                            "created_at": "2023-01-04T10:00:00Z",
                        },
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
        """Test main() with workflow_path filter."""

        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string(
                    [
                        {
                            "id": 1,
                            "name": "CI",
                            "path": "/workflows/ci.yml",
                            "status": "completed",
                            "created_at": "2023-01-01T10:00:00Z",
                        },
                        {
                            "id": 2,
                            "name": "Build",
                            "path": "/workflows/build.yml",
                            "status": "completed",
                            "created_at": "2023-01-02T10:00:00Z",
                        },
                        {
                            "id": 3,
                            "name": "Deploy",
                            "path": "/workflows/deploy.yml",
                            "status": "in_progress",
                            "created_at": "2023-01-03T10:00:00Z",
                        },
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
            assert result.runs[0]["path"] == "/workflows/ci.yml"
            assert result.status_counts["completed"] == 1

    def test_runs_with_undefined_status(self):
        """Test main() with runs having missing status field."""

        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string(
                    [
                        {
                            "id": 1,
                            "name": "CI",
                            "path": "/workflows/ci.yml",
                            "created_at": "2023-01-01T10:00:00Z",
                            # Missing status field
                        },
                        {
                            "id": 2,
                            "name": "Build",
                            "path": "/workflows/build.yml",
                            "status": "completed",
                            "created_at": "2023-01-02T10:00:00Z",
                        },
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

            # Verify undefined status is counted
            assert result.status_counts["undefined"] == 1
            assert result.status_counts["completed"] == 1
            assert len(result.runs) == 2
