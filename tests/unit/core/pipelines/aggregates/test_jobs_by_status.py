from unittest.mock import patch
from core.pipelines.aggregates.jobs_by_status import JobsByStatus
from core.pipelines.pipelines_repository import PipelinesRepository
from tests.builders import as_json_string
from tests.in_memory_configuration import InMemoryConfiguration


class TestJobsByStatus:

    def test_empty_jobs_and_runs(self):
        """Test main() with empty jobs and runs."""

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
            jobs_by_status = JobsByStatus(repository=repository)

            result = jobs_by_status.main(job_name="test")

            # Verify result structure for empty data
            assert result.status_counts == {}
            assert result.dates == []
            assert result.conclusions == []
            assert result.matrix == []
            assert result.runs == []

    def test_jobs_grouped_by_day(self):
        """Test main() with jobs grouped by day and different conclusions."""

        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string([
                    {
                        "id": 1,
                        "name": "CI",
                        "path": "/workflows/ci.yml",
                        "conclusion": "success",
                        "created_at": "2023-01-01T10:00:00Z",
                    },
                    {
                        "id": 2,
                        "name": "CI",
                        "path": "/workflows/ci.yml",
                        "conclusion": "failure",
                        "created_at": "2023-01-02T10:00:00Z",
                    },
                ])
            if file == "jobs.json":
                return as_json_string([
                    {
                        "id": 101,
                        "name": "build",
                        "run_id": 1,
                        "conclusion": "success",
                        "created_at": "2023-01-01T10:00:00Z",
                    },
                    {
                        "id": 102,
                        "name": "build",
                        "run_id": 1,
                        "conclusion": "success",
                        "created_at": "2023-01-01T11:00:00Z",
                    },
                    {
                        "id": 103,
                        "name": "build",
                        "run_id": 2,
                        "conclusion": "failure",
                        "created_at": "2023-01-02T10:00:00Z",
                    },
                ])
            return None

        with patch(
            "core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            repository = PipelinesRepository(configuration=InMemoryConfiguration("."))
            jobs_by_status = JobsByStatus(repository=repository)

            result = jobs_by_status.main(job_name="build", aggregate_by_week=False)

            # Verify status counts for runs
            assert result.status_counts["success"] == 1
            assert result.status_counts["failure"] == 1

            # Verify date grouping (2 days)
            assert len(result.dates) == 2
            assert "2023-01-01" in result.dates
            assert "2023-01-02" in result.dates

            # Verify conclusions order (success, failure)
            assert "success" in result.conclusions
            assert "failure" in result.conclusions

            # Verify matrix structure (rows per conclusion, columns per date)
            assert len(result.matrix) == len(result.conclusions)
            assert len(result.matrix[0]) == len(result.dates)

            # Verify counts in matrix
            success_index = result.conclusions.index("success")
            failure_index = result.conclusions.index("failure")
            day1_index = result.dates.index("2023-01-01")
            day2_index = result.dates.index("2023-01-02")

            assert result.matrix[success_index][day1_index] == 2
            assert result.matrix[success_index][day2_index] == 0
            assert result.matrix[failure_index][day1_index] == 0
            assert result.matrix[failure_index][day2_index] == 1

    def test_jobs_grouped_by_week(self):
        """Test main() with jobs grouped by week."""

        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string([
                    {
                        "id": 1,
                        "name": "CI",
                        "conclusion": "success",
                        "created_at": "2023-01-02T10:00:00Z",  # Week 1
                    },
                    {
                        "id": 2,
                        "name": "CI",
                        "conclusion": "success",
                        "created_at": "2023-01-09T10:00:00Z",  # Week 2
                    },
                ])
            if file == "jobs.json":
                return as_json_string([
                    {
                        "id": 101,
                        "name": "deploy",
                        "run_id": 1,
                        "conclusion": "success",
                        "created_at": "2023-01-02T10:00:00Z",
                    },
                    {
                        "id": 102,
                        "name": "deploy",
                        "run_id": 1,
                        "conclusion": "success",
                        "created_at": "2023-01-03T10:00:00Z",
                    },
                    {
                        "id": 103,
                        "name": "deploy",
                        "run_id": 2,
                        "conclusion": "failure",
                        "created_at": "2023-01-09T10:00:00Z",
                    },
                ])
            return None

        with patch(
            "core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            repository = PipelinesRepository(configuration=InMemoryConfiguration("."))
            jobs_by_status = JobsByStatus(repository=repository)

            result = jobs_by_status.main(job_name="deploy", aggregate_by_week=True)

            # Verify date grouping by week (2 weeks)
            assert len(result.dates) == 2
            assert "2023-W01" in result.dates
            assert "2023-W02" in result.dates

            # Verify conclusions
            assert "success" in result.conclusions
            assert "failure" in result.conclusions

            # Verify matrix structure
            assert len(result.matrix) == len(result.conclusions)
            assert len(result.matrix[0]) == len(result.dates)

            # Verify counts by week
            success_index = result.conclusions.index("success")
            failure_index = result.conclusions.index("failure")
            week1_index = result.dates.index("2023-W01")
            week2_index = result.dates.index("2023-W02")

            assert result.matrix[success_index][week1_index] == 2
            assert result.matrix[success_index][week2_index] == 0
            assert result.matrix[failure_index][week1_index] == 0
            assert result.matrix[failure_index][week2_index] == 1
