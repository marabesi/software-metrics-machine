from unittest.mock import patch, MagicMock

import pytest
from software_metrics_machine.core.pipelines.aggregates.deployment_frequency import (
    DeploymentFrequency,
)
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)
from tests.builders import as_json_string, github_workflows_data
from tests.in_memory_configuration import InMemoryConfiguration

from tests.pipeline_builder import PipelineBuilder, PipelineJobBuilder
from tests.builders import mocked_read_file_if_exists


class TestDeploymentFrequency:

    @pytest.mark.parametrize(
        "data, job_name",
        [
            (
                {
                    "pipelines": [],
                    "jobs": [],
                },
                None,
            ),
            (
                {
                    "pipelines": github_workflows_data(),
                    "jobs": [
                        PipelineJobBuilder()
                        .with_run_id(1)
                        .with_name("Deploy")
                        .with_conclusion("success")
                        .with_started_at("2023-10-01T09:05:00Z")
                        .with_completed_at("2023-10-01T09:10:00Z")
                        .build(),
                        PipelineJobBuilder()
                        .with_run_id(1)
                        .with_name("Build")
                        .with_conclusion("failed")
                        .with_started_at("2023-01-01T09:05:00Z")
                        .with_completed_at("2023-01-01T09:10:00Z")
                        .build(),
                    ],
                },
                None,
            ),
            (
                {
                    "pipelines": github_workflows_data(),
                    "jobs": [
                        PipelineJobBuilder()
                        .with_run_id(1)
                        .with_name("Deploy")
                        .with_conclusion("success")
                        .with_started_at("2023-10-01T09:05:00Z")
                        .with_completed_at("2023-10-01T09:10:00Z")
                        .build(),
                        PipelineJobBuilder()
                        .with_run_id(1)
                        .with_name("Build")
                        .with_conclusion("failed")
                        .with_started_at("2023-01-01T09:05:00Z")
                        .with_completed_at("2023-01-01T09:10:00Z")
                        .build(),
                    ],
                },
                "NonExistentJob",
            ),
        ],
    )
    def test_no_compute_without_data(self, data, job_name):
        pipelines = data["pipelines"]
        jobs = data["jobs"]

        with patch(
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=lambda file: mocked_read_file_if_exists(file, pipelines, jobs),
        ):
            repository = PipelinesRepository(configuration=InMemoryConfiguration("."))

            deployment_frequency = DeploymentFrequency(repository=repository)
            result = deployment_frequency.execute(workflow_path=None, job_name=job_name)

            assert [] == result["days"]
            assert [] == result["daily_counts"]
            assert [] == result["weekly_counts"]
            assert [] == result["weeks"]
            assert [] == result["monthly_counts"]

    def test_no_compute_with_missing_workflow(self):
        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string(github_workflows_data())
            if file == "jobs.json":
                return as_json_string(
                    [
                        PipelineJobBuilder()
                        .with_run_id(1)
                        .with_name("Deploy")
                        .with_conclusion("success")
                        .with_started_at("2023-10-01T09:05:00Z")
                        .with_completed_at("2023-10-01T09:10:00Z")
                        .build(),
                        PipelineJobBuilder()
                        .with_run_id(1)
                        .with_name("Build")
                        .with_conclusion("failed")
                        .with_started_at("2023-01-01T09:05:00Z")
                        .with_completed_at("2023-01-01T09:10:00Z")
                        .build(),
                    ]
                )

        with patch(
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
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
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
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
                        PipelineBuilder()
                        .with_id(2)
                        .with_name("Build")
                        .with_conclusion("success")
                        .with_created_at("2023-01-02T10:00:00Z")
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

            call_kwargs = repository.get_deployment_frequency_for_job.call_args[1]
            assert call_kwargs["filters"]["path"] == "/workflows/deploy.yml"

            assert result["frequency"] == 1
            assert len(result["deployments"]) == 1

    def test_runs_with_date_range_filter(self):
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
                        PipelineBuilder()
                        .with_id(2)
                        .with_name("Deploy")
                        .with_conclusion("success")
                        .with_created_at("2023-01-02T10:00:00Z")
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

            call_kwargs = repository.get_deployment_frequency_for_job.call_args[1]
            assert call_kwargs["filters"]["start_date"] == "2023-01-01"
            assert call_kwargs["filters"]["end_date"] == "2023-01-31"
            assert call_kwargs["filters"]["path"] == "/workflows/deploy.yml"

            assert result["frequency"] == 1
