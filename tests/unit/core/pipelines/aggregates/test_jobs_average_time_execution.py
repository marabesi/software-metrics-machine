from unittest.mock import patch
from src.core.pipelines.aggregates.jobs_average_time_execution import (
    JobsByAverageTimeExecution,
)
from src.core.pipelines.pipelines_repository import PipelinesRepository
from tests.builders import as_json_string
from tests.in_memory_configuration import InMemoryConfiguration


class TestJobsByAverageTimeExecution:

    def test_empty_jobs(self):
        """Test main() with empty jobs and runs."""

        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string([])
            if file == "jobs.json":
                return as_json_string([])
            return None

        with patch(
            "src.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            repository = PipelinesRepository(configuration=InMemoryConfiguration("."))
            jobs_avg = JobsByAverageTimeExecution(repository=repository)

            result = jobs_avg.main()

            assert result.runs == []
            assert result.jobs == []
            assert result.averages == []
            assert result.counts == {}

    def test_jobs_with_valid_execution_times(self):
        """Test main() with jobs having valid started_at and completed_at times."""

        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string(
                    [
                        {
                            "id": 1,
                            "name": "CI",
                            "path": "/workflows/ci.yml",
                            "created_at": "2023-01-01T10:00:00Z",
                        },
                    ]
                )
            if file == "jobs.json":
                return as_json_string(
                    [
                        {
                            "id": 101,
                            "name": "test",
                            "run_id": 1,
                            "started_at": "2023-01-01T10:00:00Z",
                            "completed_at": "2023-01-01T10:05:00Z",  # 5 minutes
                        },
                        {
                            "id": 102,
                            "name": "test",
                            "run_id": 1,
                            "started_at": "2023-01-01T10:10:00Z",
                            "completed_at": "2023-01-01T10:25:00Z",  # 15 minutes
                        },
                        {
                            "id": 103,
                            "name": "build",
                            "run_id": 1,
                            "started_at": "2023-01-01T10:00:00Z",
                            "completed_at": "2023-01-01T10:10:00Z",  # 10 minutes
                        },
                    ]
                )
            return None

        with patch(
            "src.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            repository = PipelinesRepository(configuration=InMemoryConfiguration("."))
            jobs_avg = JobsByAverageTimeExecution(repository=repository)

            result = jobs_avg.main(top=10)

            assert result.counts["test"] == 2
            assert result.counts["build"] == 1

            assert len(result.averages) == 2

            job_names = [avg[0] for avg in result.averages]
            job_avgs = [avg[1] for avg in result.averages]

            assert "test" in job_names
            assert "build" in job_names

            test_idx = job_names.index("test")
            build_idx = job_names.index("build")

            assert abs(job_avgs[test_idx] - 10.0) < 0.01
            assert abs(job_avgs[build_idx] - 10.0) < 0.01

    def test_ignores_jobs_with_missing_timestamps(self):
        """Test main() with jobs missing started_at or completed_at fields."""

        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string(
                    [
                        {
                            "id": 1,
                            "name": "CI",
                            "created_at": "2023-01-01T10:00:00Z",
                        },
                    ]
                )
            if file == "jobs.json":
                return as_json_string(
                    [
                        {
                            "id": 101,
                            "name": "test",
                            "run_id": 1,
                            # Missing started_at
                            "completed_at": "2023-01-01T10:05:00Z",
                        },
                        {
                            "id": 102,
                            "name": "build",
                            "run_id": 1,
                            "started_at": "2023-01-01T10:00:00Z",
                            # Missing completed_at
                        },
                        {
                            "id": 103,
                            "name": "deploy",
                            "run_id": 1,
                            "started_at": "2023-01-01T10:00:00Z",
                            "completed_at": "2023-01-01T10:02:00Z",  # 2 minutes
                        },
                    ]
                )
            return None

        with patch(
            "src.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            repository = PipelinesRepository(configuration=InMemoryConfiguration("."))
            jobs_avg = JobsByAverageTimeExecution(repository=repository)

            result = jobs_avg.main()

            assert result.counts["deploy"] == 1
            assert len(result.averages) == 1
            assert result.averages[0][0] == "deploy"
            assert abs(result.averages[0][1] - 2.0) < 0.01

    def test_limits_return_to_top_limit_parameter(self):
        """Test main() with top parameter limiting results."""

        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string([{"id": 1, "name": "CI"}])
            if file == "jobs.json":
                return as_json_string(
                    [
                        {
                            "id": 101,
                            "name": "job1",
                            "run_id": 1,
                            "started_at": "2023-01-01T10:00:00Z",
                            "completed_at": "2023-01-01T10:10:00Z",
                        },
                        {
                            "id": 102,
                            "name": "job2",
                            "run_id": 1,
                            "started_at": "2023-01-01T10:00:00Z",
                            "completed_at": "2023-01-01T10:20:00Z",
                        },
                        {
                            "id": 103,
                            "name": "job3",
                            "run_id": 1,
                            "started_at": "2023-01-01T10:00:00Z",
                            "completed_at": "2023-01-01T10:30:00Z",
                        },
                    ]
                )
            return None

        with patch(
            "src.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            repository = PipelinesRepository(configuration=InMemoryConfiguration("."))
            jobs_avg = JobsByAverageTimeExecution(repository=repository)

            result = jobs_avg.main(top=2)

            assert len(result.averages) == 2
            assert result.averages[0][0] == "job3"  # 30 minutes
            assert result.averages[1][0] == "job2"  # 20 minutes
