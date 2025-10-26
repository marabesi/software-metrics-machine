from unittest.mock import patch

import pytest

from core.pipelines.pipelines_repository import PipelinesRepository
from tests.builders import as_json_string
from tests.in_memory_configuration import InMemoryConfiguration

single_completed_pipeline_run = as_json_string(
    [
        {
            "id": 1,
            "path": "/workflows/build.yml",
            "status": "completed",
            "conclusion": "success",
            "created_at": "2023-10-01T09:00:00Z",
        },
    ]
)


def pipeline_run_completed_with_success(file, jobs):
    if file == "workflows.json":
        return single_completed_pipeline_run
    elif file == "jobs.json":
        return as_json_string(jobs)
    return None


class TestPipelinesRepositoryDeploymentFrequency:

    @pytest.fixture(scope="function", autouse=True)
    def reset_mocks(self):
        with patch(
            "core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists"
        ) as mock_exists:
            mock_exists.reset_mock()
            yield mock_exists

    def test_show_empty_deployment_frequency_when_no_data(self):
        empty_pipeline_runs = as_json_string([])
        with (
            patch(
                "core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
                return_value=empty_pipeline_runs,
            ),
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            result = loader.get_deployment_frequency_for_job(
                job_name="Deploy", filters=None
            )
            assert 0 == len(result["months"])
            assert 0 == len(result["weeks"])
            assert 0 == len(result["weekly_counts"])
            assert 0 == len(result["monthly_counts"])

    def test_deployment_frequency(self):
        jobs = [
            {
                "id": 105,
                "run_id": 1,
                "name": "Deploy",
                "conclusion": "success",
                "started_at": "2023-10-01T09:05:00Z",
                "completed_at": "2023-10-01T09:10:00Z",
            },
        ]

        with patch(
            "core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=lambda file: pipeline_run_completed_with_success(
                file=file, jobs=jobs
            ),
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            result = loader.get_deployment_frequency_for_job(
                job_name="Deploy", filters=None
            )
            assert "2023-10" in result["months"]
            assert "2023-W39" in result["weeks"]

    def test_deployment_frequency_return_the_day_which_deployment_was_done(self):
        single_deployment = as_json_string(
            [
                {
                    "id": 1,
                    "path": "/workflows/build.yml",
                    "status": "success",
                    "created_at": "2023-10-01T09:00:00Z",
                },
            ]
        )

        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return single_deployment
            elif file == "jobs.json":
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
                    ]
                )
            return None

        with patch(
            "core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            result = loader.get_deployment_frequency_for_job(
                job_name="Deploy", filters=None
            )
            assert "2023-10-01" in result["days"]

    @pytest.mark.skip(reason="Not implemented yet")
    def test_should_calculate_all_weeks_between_two_dates_when_data_exists(self):
        pass

    def test_should_not_compute_when_job_failed(self):
        single_deployment = as_json_string(
            [
                {
                    "id": 1,
                    "path": "/workflows/build.yml",
                    "status": "success",
                    "created_at": "2023-10-01T09:00:00Z",
                },
            ]
        )

        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return single_deployment
            elif file == "jobs.json":
                return as_json_string(
                    [
                        {
                            "id": 105,
                            "run_id": 1,
                            "name": "Deploy",
                            "conclusion": "fail",
                            "started_at": "2023-10-01T09:05:00Z",
                            "completed_at": "2023-10-01T09:10:00Z",
                        },
                    ]
                )
            return None

        with patch(
            "core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            result = loader.get_deployment_frequency_for_job(
                job_name="Deploy", filters=None
            )

            assert 0 == len(result["months"])
            assert 0 == len(result["weeks"])
            assert 0 == len(result["weekly_counts"])
            assert 0 == len(result["monthly_counts"])
