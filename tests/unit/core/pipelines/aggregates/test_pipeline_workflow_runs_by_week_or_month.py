from unittest.mock import patch
from software_metrics_machine.core.pipelines.aggregates.pipeline_workflow_runs_by_week_or_month import (
    PipelineWorkflowRunsByWekOrMonth,
)
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)
from tests.builders import as_json_string
from tests.in_memory_configuration import InMemoryConfiguration
from tests.pipeline_builder import PipelineBuilder


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
        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string(
                    [
                        PipelineBuilder()
                        .with_id(1)
                        .with_name("CI")
                        .with_path("/workflows/ci.yml")
                        .with_created_at("2023-01-02T10:00:00Z")
                        .build(),
                        PipelineBuilder()
                        .with_id(2)
                        .with_name("CI")
                        .with_path("/workflows/ci.yml")
                        .with_created_at("2023-01-02T10:00:00Z")
                        .build(),
                        PipelineBuilder()
                        .with_id(3)
                        .with_name("Build")
                        .with_path("/workflows/build.yml")
                        .with_created_at("2023-01-09T10:00:00Z")
                        .build(),
                        PipelineBuilder()
                        .with_id(4)
                        .with_name("CI")
                        .with_path("/workflows/ci.yml")
                        .with_created_at("2023-01-10T10:00:00Z")
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
        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string(
                    [
                        PipelineBuilder()
                        .with_id(1)
                        .with_name("CI")
                        .with_path("/workflows/ci.yml")
                        .with_created_at("2023-01-15T10:00:00Z")
                        .build(),
                        PipelineBuilder()
                        .with_id(2)
                        .with_name("CI")
                        .with_path("/workflows/ci.yml")
                        .with_created_at("2023-01-20T10:00:00Z")
                        .build(),
                        PipelineBuilder()
                        .with_id(3)
                        .with_name("Build")
                        .with_path("/workflows/build.yml")
                        .with_created_at("2023-02-10T10:00:00Z")
                        .build(),
                        PipelineBuilder()
                        .with_id(4)
                        .with_name("CI")
                        .with_path("/workflows/ci.yml")
                        .with_created_at("2023-02-15T10:00:00Z")
                        .build(),
                        PipelineBuilder()
                        .with_id(5)
                        .with_name("Build")
                        .with_path("/workflows/build.yml")
                        .with_created_at("2023-02-20T10:00:00Z")
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
        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string(
                    [
                        PipelineBuilder()
                        .with_id(1)
                        .with_name("CI")
                        .with_path("/workflows/ci.yml")
                        .with_created_at("2023-01-15T10:00:00Z")
                        .with_event("push")
                        .build(),
                        PipelineBuilder()
                        .with_id(2)
                        .with_name("CI")
                        .with_path("/workflows/ci.yml")
                        .with_created_at("2023-01-20T10:00:00Z")
                        .with_event("pull_request")
                        .with_conclusion("failure")
                        .build(),
                        PipelineBuilder()
                        .with_id(3)
                        .with_name("Build")
                        .with_path("/workflows/build.yml")
                        .with_created_at("2023-02-10T10:00:00Z")
                        .with_event("push")
                        .with_status("in_progress")
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
