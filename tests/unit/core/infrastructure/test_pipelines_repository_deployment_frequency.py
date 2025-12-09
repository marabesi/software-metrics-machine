from unittest.mock import patch

import pytest

from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)
from tests.builders import as_json_string
from tests.in_memory_configuration import InMemoryConfiguration
from tests.pipeline_builder import PipelineBuilder, PipelineJobBuilder
from tests.builders import mocked_read_file_if_exists

single_completed_pipeline_run = as_json_string(
    [
        PipelineBuilder()
        .with_id(1)
        .with_path("/workflows/build.yml")
        .with_status("completed")
        .with_conclusion("success")
        .with_created_at("2023-10-01T09:00:00Z")
    ]
)


def pipeline_run_completed_with_success(file, jobs):
    if file == "workflows.json":
        return single_completed_pipeline_run
    elif file == "jobs.json":
        return as_json_string(jobs)
    return None


jobs = [
    PipelineJobBuilder()
    .with_id(105)
    .with_run_id(1)
    .with_name("Deploy")
    .with_conclusion("success")
    .with_started_at("2023-10-01T09:05:00Z")
    .with_completed_at("2023-10-01T09:10:00Z")
    .build(),
]
pipeline = [
    PipelineBuilder()
    .with_id(1)
    .with_path("/workflows/build.yml")
    .with_status("completed")
    .with_conclusion("success")
    .with_created_at("2023-10-01T09:00:00Z")
    .build()
]


class TestPipelinesRepositoryDeploymentFrequency:

    @pytest.fixture(scope="function", autouse=True)
    def reset_mocks(self):
        with patch(
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists"
        ) as mock_exists:
            mock_exists.reset_mock()
            yield mock_exists

    def test_show_empty_deployment_frequency_when_no_data(self):
        empty_pipeline_runs = as_json_string([])
        with (
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
                return_value=empty_pipeline_runs,
            ),
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            result = loader.get_deployment_frequency_for_job(
                job_name="Deploy", filters=None
            )
            assert 0 == len(result.months)
            assert 0 == len(result.weeks)
            assert 0 == len(result.days)

    def test_deployment_frequency(self):
        with patch(
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=lambda file: mocked_read_file_if_exists(file, pipeline, jobs),
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            result = loader.get_deployment_frequency_for_job(
                job_name="Deploy", filters=None
            )
            assert any(item.date == "2023-10" for item in result.months)
            assert any(item.date == "2023-W39" for item in result.weeks)

    def test_deployment_frequency_return_the_day_which_deployment_was_done(self):
        with patch(
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=lambda file: mocked_read_file_if_exists(file, pipeline, jobs),
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            result = loader.get_deployment_frequency_for_job(
                job_name="Deploy", filters=None
            )
            assert any(item.date == "2023-10-01" for item in result.days)

    def test_should_not_compute_when_job_failed(self):
        failed_jobs = [
            PipelineJobBuilder()
            .with_id(105)
            .with_run_id(1)
            .with_name("Deploy")
            .with_conclusion("fail")
            .with_started_at("2023-10-01T09:05:00Z")
            .with_completed_at("2023-10-01T09:10:00Z")
            .build(),
        ]

        with patch(
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=lambda file: mocked_read_file_if_exists(
                file, pipeline, failed_jobs
            ),
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            result = loader.get_deployment_frequency_for_job(
                job_name="Deploy", filters=None
            )

            assert 0 == len(result.months)
            assert 0 == len(result.weeks)
            assert 0 == len(result.days)
