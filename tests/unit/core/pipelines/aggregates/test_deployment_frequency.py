from unittest.mock import patch, MagicMock
from core.pipelines.aggregates.deployment_frequency import DeploymentFrequency
from core.pipelines.pipelines_repository import PipelinesRepository
from tests.builders import as_json_string, github_workflows_data
from tests.in_memory_configuration import InMemoryConfiguration


class TestDeploymentFrequency:

    def test_no_compute_without_workflow_and_job(self):
        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string(github_workflows_data())
            if file == "jobs.json":
                return as_json_string(
                    [
                        {
                            "id": 105,
                            "run_id": 1,
                            "name": "Deploy",
                            "conclusion": "success",
                            "started_at": "2023-10-01T09:05:00Z",
                            "completed_at": "2023-10-01T09:10:00Z",
                        },
                        {
                            "id": 107,
                            "run_id": 1,
                            "name": "Build",
                            "conclusion": "failed",
                            "started_at": "2023-01-01T09:05:00Z",
                            "completed_at": "2023-01-01T09:10:00Z",
                        },
                    ]
                )

        with patch(
            "core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            repository = PipelinesRepository(configuration=InMemoryConfiguration("."))

            deployment_frequency = DeploymentFrequency(repository=repository)
            result = deployment_frequency.execute(workflow_path=None, job_name=None)

            assert [] == result["days"]
            assert [] == result["daily_counts"]
            assert [] == result["weekly_counts"]
            assert [] == result["weeks"]
            assert [] == result["monthly_counts"]

    def test_no_compute_with_missing_workflow_(self):
        """If no workflow_path and no job_name are provided, do not compute deployment frequency."""

        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string(github_workflows_data())
            if file == "jobs.json":
                return as_json_string(
                    [
                        {
                            "id": 105,
                            "run_id": 1,
                            "name": "Deploy",
                            "conclusion": "success",
                            "started_at": "2023-10-01T09:05:00Z",
                            "completed_at": "2023-10-01T09:10:00Z",
                        },
                        {
                            "id": 107,
                            "run_id": 1,
                            "name": "Build",
                            "conclusion": "failed",
                            "started_at": "2023-01-01T09:05:00Z",
                            "completed_at": "2023-01-01T09:10:00Z",
                        },
                    ]
                )

        with patch(
            "core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            configuration = InMemoryConfiguration(".")
            configuration.deployment_frequency_target_job = "Deploy"
            repository = PipelinesRepository(configuration=configuration)

            deployment_frequency = DeploymentFrequency(repository=repository)
            result = deployment_frequency.execute(workflow_path=None, job_name=None)

            assert [] == result["days"]
            assert [] == result["daily_counts"]
            assert [] == result["weekly_counts"]
            assert [] == result["weeks"]
            assert [] == result["monthly_counts"]

    def test_empty_runs(self):
        """Test execute() with empty runs."""

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

            # Mock the get_deployment_frequency_for_job method (repository-shaped result)
            repository.get_deployment_frequency_for_job = MagicMock(
                return_value={
                    "days": [],
                    "weeks": [],
                    "daily_counts": [],
                    "weekly_counts": [],
                    "monthly_counts": [],
                }
            )

            deployment_freq = DeploymentFrequency(repository=repository)
            result = deployment_freq.execute(
                workflow_path="/workflows/deploy.yml", job_name="deploy"
            )

            # Verify that the method was called with correct parameters
            repository.get_deployment_frequency_for_job.assert_called_once()
            call_kwargs = repository.get_deployment_frequency_for_job.call_args[1]
            assert call_kwargs["job_name"] == "deploy"
            assert "path" in call_kwargs["filters"]

            # Verify empty result (repository-shaped)
            assert result["days"] == []
            assert result["daily_counts"] == []

    def test_runs_with_workflow_path_filter(self):
        """Test execute() with workflow path filter."""

        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string(
                    [
                        {
                            "id": 1,
                            "name": "Deploy",
                            "path": "/workflows/deploy.yml",
                            "created_at": "2023-01-01T10:00:00Z",
                        },
                        {
                            "id": 2,
                            "name": "Build",
                            "path": "/workflows/build.yml",
                            "created_at": "2023-01-02T10:00:00Z",
                        },
                    ]
                )
            if file == "jobs.json":
                return as_json_string([])
            return None

        with patch(
            "core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            repository = PipelinesRepository(configuration=InMemoryConfiguration("."))

            # Mock the get_deployment_frequency_for_job method
            repository.get_deployment_frequency_for_job = MagicMock(
                return_value={
                    "frequency": 1,
                    "deployments": [{"date": "2023-01-01", "count": 1}],
                }
            )

            deployment_freq = DeploymentFrequency(repository=repository)
            result = deployment_freq.execute(
                workflow_path="/workflows/deploy.yml", job_name="deploy"
            )

            # Verify that path filter was applied
            call_kwargs = repository.get_deployment_frequency_for_job.call_args[1]
            assert call_kwargs["filters"]["path"] == "/workflows/deploy.yml"

            # Verify result structure
            assert result["frequency"] == 1
            assert len(result["deployments"]) == 1

    def test_runs_with_date_range_filter(self):
        """Test execute() with start_date and end_date filters."""

        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string(
                    [
                        {
                            "id": 1,
                            "name": "Deploy",
                            "path": "/workflows/deploy.yml",
                            "created_at": "2023-01-15T10:00:00Z",
                        },
                        {
                            "id": 2,
                            "name": "Deploy",
                            "path": "/workflows/deploy.yml",
                            "created_at": "2023-02-15T10:00:00Z",
                        },
                    ]
                )
            if file == "jobs.json":
                return as_json_string([])
            return None

        with patch(
            "core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            repository = PipelinesRepository(configuration=InMemoryConfiguration("."))

            # Mock the get_deployment_frequency_for_job method
            repository.get_deployment_frequency_for_job = MagicMock(
                return_value={
                    "frequency": 1,
                    "deployments": [{"date": "2023-01", "count": 1}],
                }
            )

            deployment_freq = DeploymentFrequency(repository=repository)
            result = deployment_freq.execute(
                workflow_path="/workflows/deploy.yml",
                job_name="deploy",
                start_date="2023-01-01",
                end_date="2023-01-31",
            )

            # Verify that date filters were applied
            call_kwargs = repository.get_deployment_frequency_for_job.call_args[1]
            assert call_kwargs["filters"]["start_date"] == "2023-01-01"
            assert call_kwargs["filters"]["end_date"] == "2023-01-31"
            assert call_kwargs["filters"]["path"] == "/workflows/deploy.yml"

            # Verify result
            assert result["frequency"] == 1
