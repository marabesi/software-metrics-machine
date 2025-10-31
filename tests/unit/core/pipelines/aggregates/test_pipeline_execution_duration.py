from unittest.mock import patch, MagicMock
from core.pipelines.aggregates.pipeline_execution_duration import (
    PipelineExecutionDuration,
)
from core.pipelines.pipelines_repository import PipelinesRepository
from tests.builders import as_json_string
from tests.in_memory_configuration import InMemoryConfiguration


class TestPipelineExecutionDuration:

    def test_empty_runs(self):
        """Test main() with empty runs."""

        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string([])
            if file == "jobs.json":
                return as_json_string([])
            return None

        with patch(
            "core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            repository = PipelinesRepository(configuration=InMemoryConfiguration("."))

            # Mock the get_workflows_run_duration method
            repository.get_workflows_run_duration = MagicMock(
                return_value={"total": 0, "rows": []}
            )

            pipeline_duration = PipelineExecutionDuration(repository=repository)
            result = pipeline_duration.main()

            # Verify empty result structure
            assert result.names == []
            assert result.values == []
            assert result.counts == []
            assert result.rows == []

    def test_runs_with_avg_metric(self):
        """Test main() with runs and avg metric (default)."""

        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string([])
            if file == "jobs.json":
                return as_json_string([])
            return None

        with patch(
            "core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            repository = PipelinesRepository(configuration=InMemoryConfiguration("."))

            # Mock the get_workflows_run_duration method
            # rows format: [name, count, avg, sum]
            repository.get_workflows_run_duration = MagicMock(
                return_value={
                    "total": 3,
                    "rows": [
                        ["CI Pipeline", 5, 10.5, 52.5],
                        ["Build Pipeline", 3, 15.0, 45.0],
                        ["Deploy Pipeline", 2, 8.0, 16.0],
                    ],
                }
            )

            pipeline_duration = PipelineExecutionDuration(repository=repository)
            result = pipeline_duration.main(metric="avg", sort_by="avg")

            # Verify result structure
            assert len(result.names) == 3
            assert len(result.values) == 3
            assert len(result.counts) == 3

            # Verify sorting by avg (descending)
            assert result.names[0] == "Build Pipeline"
            assert result.names[1] == "CI Pipeline"
            assert result.names[2] == "Deploy Pipeline"

            # Verify values are averages
            assert result.values[0] == 15.0
            assert result.values[1] == 10.5
            assert result.values[2] == 8.0

            # Verify ylabel and title_metric
            assert result.ylabel == "Average minutes"
            assert result.title_metric == "Average"

    def test_runs_with_sum_metric(self):
        """Test main() with sum metric."""

        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string([])
            if file == "jobs.json":
                return as_json_string([])
            return None

        with patch(
            "core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            repository = PipelinesRepository(configuration=InMemoryConfiguration("."))

            # Mock the get_workflows_run_duration method
            repository.get_workflows_run_duration = MagicMock(
                return_value={
                    "total": 2,
                    "rows": [
                        ["CI Pipeline", 5, 10.0, 50.0],
                        ["Build Pipeline", 3, 20.0, 60.0],
                    ],
                }
            )

            pipeline_duration = PipelineExecutionDuration(repository=repository)
            result = pipeline_duration.main(metric="sum", sort_by="sum")

            # Verify values are sums
            assert result.values[0] == 60.0
            assert result.values[1] == 50.0

            # Verify ylabel and title_metric
            assert result.ylabel == "Total minutes"
            assert result.title_metric == "Total"

    def test_runs_with_count_metric(self):
        """Test main() with count metric."""

        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string([])
            if file == "jobs.json":
                return as_json_string([])
            return None

        with patch(
            "core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            repository = PipelinesRepository(configuration=InMemoryConfiguration("."))

            # Mock the get_workflows_run_duration method
            repository.get_workflows_run_duration = MagicMock(
                return_value={
                    "total": 2,
                    "rows": [
                        ["CI Pipeline", 10, 5.0, 50.0],
                        ["Build Pipeline", 3, 20.0, 60.0],
                    ],
                }
            )

            pipeline_duration = PipelineExecutionDuration(repository=repository)
            result = pipeline_duration.main(metric="count", sort_by="count")

            # Verify values are counts
            assert result.values[0] == 10
            assert result.values[1] == 3

            # Verify ylabel and title_metric
            assert result.ylabel == "Count"
            assert result.title_metric == "Count"

    def test_max_runs_limit(self):
        """Test main() with max_runs parameter limiting results."""

        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string([])
            if file == "jobs.json":
                return as_json_string([])
            return None

        with patch(
            "core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            repository = PipelinesRepository(configuration=InMemoryConfiguration("."))

            # Mock the get_workflows_run_duration method with 5 rows
            repository.get_workflows_run_duration = MagicMock(
                return_value={
                    "total": 5,
                    "rows": [
                        ["Pipeline A", 1, 10.0, 10.0],
                        ["Pipeline B", 1, 20.0, 20.0],
                        ["Pipeline C", 1, 30.0, 30.0],
                        ["Pipeline D", 1, 40.0, 40.0],
                        ["Pipeline E", 1, 50.0, 50.0],
                    ],
                }
            )

            pipeline_duration = PipelineExecutionDuration(repository=repository)
            result = pipeline_duration.main(max_runs=3, sort_by="avg")

            # Should only return top 3 pipelines
            assert len(result.names) == 3
            assert len(result.values) == 3
            assert result.names[0] == "Pipeline E"
            assert result.names[1] == "Pipeline D"
            assert result.names[2] == "Pipeline C"
