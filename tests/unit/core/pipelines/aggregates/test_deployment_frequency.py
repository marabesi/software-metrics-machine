from unittest.mock import patch

import pytest
from software_metrics_machine.core.pipelines.aggregates.deployment_frequency import (
    DeploymentFrequency,
)
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)
from tests.builders import as_json_string, github_workflows_data
from tests.in_memory_configuration import InMemoryConfiguration

from tests.pipeline_builder import PipelineJobBuilder
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

            assert [] == result.days
            assert [] == result.weeks
            assert [] == result.months
            assert [] == [item.count for item in result.days]
            assert [] == [item.count for item in result.weeks]
            assert [] == [item.count for item in result.months]

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

            assert [] == result.days
            assert [] == result.weeks
            assert [] == result.months
            assert [] == [item.count for item in result.days]
            assert [] == [item.count for item in result.weeks]
            assert [] == [item.count for item in result.months]

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
            configuration = InMemoryConfiguration(".")
            configuration.deployment_frequency_target_job = "Deploy"
            repository = PipelinesRepository(configuration=configuration)

            deployment_frequency = DeploymentFrequency(repository=repository)
            result = deployment_frequency.execute(workflow_path=None, job_name=None)

            assert [] == result.days
            assert [] == result.weeks
            assert [] == result.months
            assert [] == [item.count for item in result.days]
            assert [] == [item.count for item in result.weeks]
            assert [] == [item.count for item in result.months]

    def test_runs_with_workflow_path_filter(self):
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
                    ]
                )

        with patch(
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            repository = PipelinesRepository(configuration=InMemoryConfiguration("."))
            deployment_frequency = DeploymentFrequency(repository=repository)

            result = deployment_frequency.execute(
                workflow_path="/workflows/tests.yml", job_name="Deploy"
            )

            assert len(result.days) == 1
