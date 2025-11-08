from unittest.mock import patch
from src.core.pipelines.aggregates.jobs_summary import JobsSummary
from src.core.pipelines.pipelines_repository import PipelinesRepository
from tests.builders import as_json_string
from tests.in_memory_configuration import InMemoryConfiguration


class TestJobsSummary:

    def test_empty_jobs_list(self):
        """Test summarize_jobs with an empty list of jobs."""

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
            jobs_summary = JobsSummary(repository=repository)

            summary = jobs_summary.summarize_jobs([])

            # Verify empty summary structure
            assert summary["total_jobs"] == 0
            assert summary["first_job"] is None
            assert summary["last_job"] is None
            assert summary["conclusions"] == {}
            assert summary["unique_jobs"] == 0

    def test_jobs_with_conclusions_and_names(self):
        """Test summarize_jobs with typical jobs having different conclusions."""

        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string(
                    [
                        {"id": 1, "name": "CI Pipeline"},
                        {"id": 2, "name": "Build Pipeline"},
                    ]
                )
            if file == "jobs.json":
                return as_json_string(
                    [
                        {
                            "id": 101,
                            "name": "test",
                            "run_id": 1,
                            "conclusion": "success",
                            "created_at": "2023-01-01T10:00:00Z",
                        },
                        {
                            "id": 102,
                            "name": "build",
                            "run_id": 2,
                            "conclusion": "failure",
                            "created_at": "2023-01-02T10:00:00Z",
                        },
                        {
                            "id": 103,
                            "name": "test",
                            "run_id": 1,
                            "conclusion": "success",
                            "created_at": "2023-01-03T10:00:00Z",
                        },
                    ]
                )
            return None

        with patch(
            "src.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            repository = PipelinesRepository(configuration=InMemoryConfiguration("."))
            jobs_summary = JobsSummary(repository=repository)

            jobs = [
                {
                    "id": 101,
                    "name": "test",
                    "run_id": 1,
                    "conclusion": "success",
                    "created_at": "2023-01-01T10:00:00Z",
                },
                {
                    "id": 102,
                    "name": "build",
                    "run_id": 2,
                    "conclusion": "failure",
                    "created_at": "2023-01-02T10:00:00Z",
                },
                {
                    "id": 103,
                    "name": "test",
                    "run_id": 1,
                    "conclusion": "success",
                    "created_at": "2023-01-03T10:00:00Z",
                },
            ]

            summary = jobs_summary.summarize_jobs(jobs)

            # Verify total count
            assert summary["total_jobs"] == 3

            # Verify first and last jobs
            assert summary["first_job"]["id"] == 101
            assert summary["last_job"]["id"] == 103

            # Verify conclusion counts
            assert summary["conclusions"]["success"] == 2
            assert summary["conclusions"]["failure"] == 1

            # Verify unique jobs (test :: CI Pipeline, build :: Build Pipeline)
            assert summary["unique_jobs"] == 2
            assert "test :: CI Pipeline" in summary["jobs_by_name"]
            assert summary["jobs_by_name"]["test :: CI Pipeline"]["count"] == 2
            assert "build :: Build Pipeline" in summary["jobs_by_name"]
            assert summary["jobs_by_name"]["build :: Build Pipeline"]["count"] == 1

    def test_jobs_without_conclusion(self):
        """Test summarize_jobs with jobs missing conclusion field."""

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
            jobs_summary = JobsSummary(repository=repository)

            jobs = [
                {
                    "id": 201,
                    "name": "deploy",
                    "created_at": "2023-01-01T10:00:00Z",
                },
                {
                    "id": 202,
                    "name": "lint",
                    "conclusion": "success",
                    "created_at": "2023-01-02T10:00:00Z",
                },
            ]

            summary = jobs_summary.summarize_jobs(jobs)

            # Verify total count
            assert summary["total_jobs"] == 2

            # Verify conclusions include "unknown" for missing conclusions
            assert summary["conclusions"]["unknown"] == 1
            assert summary["conclusions"]["success"] == 1

            # Verify unique jobs without workflow names
            assert summary["unique_jobs"] == 2
            assert "deploy" in summary["jobs_by_name"]
            assert "lint" in summary["jobs_by_name"]
