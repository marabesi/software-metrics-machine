from unittest.mock import patch
from software_metrics_machine.core.pipelines.aggregates.pipeline_workflow_runs_by_week_or_month import (
    PipelineWorkflowRunsByWekOrMonth,
)
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)
from tests.builders import as_json_string
from tests.in_memory_configuration import InMemoryConfiguration


class TestPipelineWorkflowRunsByWeekOrMonth:

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
            workflow_runs = PipelineWorkflowRunsByWekOrMonth(repository=repository)

            result = workflow_runs.main(aggregate_by="week")

            # Verify empty result structure
            assert result.rep_dates == []
            assert result.periods == []
            assert result.workflow_names == []
            assert result.data_matrix == []
            assert result.runs == []

    def test_runs_grouped_by_week(self):
        """Test main() with runs grouped by week."""

        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string(
                    [
                        {
                            "id": 1,
                            "name": "CI",
                            "path": "/workflows/ci.yml",
                            "created_at": "2023-01-02T10:00:00Z",  # Week 1
                        },
                        {
                            "id": 2,
                            "name": "CI",
                            "path": "/workflows/ci.yml",
                            "created_at": "2023-01-03T10:00:00Z",  # Week 1
                        },
                        {
                            "id": 3,
                            "name": "Build",
                            "path": "/workflows/build.yml",
                            "created_at": "2023-01-09T10:00:00Z",  # Week 2
                        },
                        {
                            "id": 4,
                            "name": "CI",
                            "path": "/workflows/ci.yml",
                            "created_at": "2023-01-10T10:00:00Z",  # Week 2
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
            workflow_runs = PipelineWorkflowRunsByWekOrMonth(repository=repository)

            result = workflow_runs.main(aggregate_by="week")

            # Verify periods (weeks)
            assert len(result.periods) == 2
            assert "2023-01" in result.periods
            assert "2023-02" in result.periods

            # Verify workflow names
            assert len(result.workflow_names) == 2
            assert "/workflows/build.yml" in result.workflow_names
            assert "/workflows/ci.yml" in result.workflow_names

            # Verify data matrix structure
            assert len(result.data_matrix) == 2  # 2 workflows
            assert len(result.data_matrix[0]) == 2  # 2 weeks

            # Verify counts in matrix
            # CI workflow: week1=2, week2=1
            # Build workflow: week1=0, week2=1
            ci_idx = result.workflow_names.index("/workflows/ci.yml")
            build_idx = result.workflow_names.index("/workflows/build.yml")
            week1_idx = result.periods.index("2023-01")
            week2_idx = result.periods.index("2023-02")

            assert result.data_matrix[ci_idx][week1_idx] == 2
            assert result.data_matrix[ci_idx][week2_idx] == 1
            assert result.data_matrix[build_idx][week1_idx] == 0
            assert result.data_matrix[build_idx][week2_idx] == 1

    def test_runs_grouped_by_month(self):
        """Test main() with runs grouped by month."""

        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string(
                    [
                        {
                            "id": 1,
                            "name": "CI",
                            "path": "/workflows/ci.yml",
                            "created_at": "2023-01-15T10:00:00Z",
                        },
                        {
                            "id": 2,
                            "name": "CI",
                            "path": "/workflows/ci.yml",
                            "created_at": "2023-01-20T10:00:00Z",
                        },
                        {
                            "id": 3,
                            "name": "Build",
                            "path": "/workflows/build.yml",
                            "created_at": "2023-02-10T10:00:00Z",
                        },
                        {
                            "id": 4,
                            "name": "CI",
                            "path": "/workflows/ci.yml",
                            "created_at": "2023-02-15T10:00:00Z",
                        },
                        {
                            "id": 5,
                            "name": "Build",
                            "path": "/workflows/build.yml",
                            "created_at": "2023-02-20T10:00:00Z",
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
            workflow_runs = PipelineWorkflowRunsByWekOrMonth(repository=repository)

            result = workflow_runs.main(aggregate_by="month")

            # Verify periods (months)
            assert len(result.periods) == 2
            assert "2023-01" in result.periods
            assert "2023-02" in result.periods

            # Verify workflow names
            assert len(result.workflow_names) == 2

            # Verify data matrix structure
            assert len(result.data_matrix) == 2
            assert len(result.data_matrix[0]) == 2

            # Verify counts in matrix
            ci_idx = result.workflow_names.index("/workflows/ci.yml")
            build_idx = result.workflow_names.index("/workflows/build.yml")
            jan_idx = result.periods.index("2023-01")
            feb_idx = result.periods.index("2023-02")

            assert result.data_matrix[ci_idx][jan_idx] == 2
            assert result.data_matrix[ci_idx][feb_idx] == 1
            assert result.data_matrix[build_idx][jan_idx] == 0
            assert result.data_matrix[build_idx][feb_idx] == 2

    def test_runs_with_filters(self):
        """Test main() with various filters (event, status, conclusion)."""

        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string(
                    [
                        {
                            "id": 1,
                            "name": "CI",
                            "path": "/workflows/ci.yml",
                            "event": "push",
                            "status": "completed",
                            "conclusion": "success",
                            "created_at": "2023-01-15T10:00:00Z",
                        },
                        {
                            "id": 2,
                            "name": "CI",
                            "path": "/workflows/ci.yml",
                            "event": "pull_request",
                            "status": "completed",
                            "conclusion": "failure",
                            "created_at": "2023-01-20T10:00:00Z",
                        },
                        {
                            "id": 3,
                            "name": "Build",
                            "path": "/workflows/build.yml",
                            "event": "push",
                            "status": "in_progress",
                            "created_at": "2023-02-10T10:00:00Z",
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
            workflow_runs = PipelineWorkflowRunsByWekOrMonth(repository=repository)

            # Test with raw_filters parameter
            result = workflow_runs.main(
                aggregate_by="month", raw_filters="event=push,status=completed"
            )

            # With filters, only run id=1 should match (event=push, status=completed)
            assert len(result.runs) >= 1

            # Verify periods and workflow names are populated
            assert len(result.periods) > 0
            assert len(result.workflow_names) > 0

    def test_runs_with_unnamed_workflow(self):
        """Test main() with runs missing workflow path."""

        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string(
                    [
                        {
                            "id": 1,
                            "name": "CI",
                            # Missing path field
                            "created_at": "2023-01-15T10:00:00Z",
                        },
                        {
                            "id": 2,
                            "name": "Build",
                            "path": "/workflows/build.yml",
                            "created_at": "2023-01-20T10:00:00Z",
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
            workflow_runs = PipelineWorkflowRunsByWekOrMonth(repository=repository)

            result = workflow_runs.main(aggregate_by="month")

            # Verify <unnamed> workflow is included
            assert "<unnamed>" in result.workflow_names
            assert "/workflows/build.yml" in result.workflow_names
            assert len(result.workflow_names) == 2
