from unittest.mock import patch

import pytest

from providers.github.workflows.repository_workflows import LoadWorkflows
from tests.builders import as_json_string, workflows_data
from tests.in_memory_configuration import InMemoryConfiguration


class TestRepositoryWorkflows:

    @pytest.fixture(scope="function", autouse=True)
    def reset_mocks(self):
        with patch(
            "infrastructure.base_repository.BaseRepository.read_file_if_exists"
        ) as mock_exists:
            mock_exists.reset_mock()
            yield mock_exists

    def test_get_unique_workflow_names(self):
        workflows_with_duplicates = as_json_string(
            [
                {"name": "Build Workflow", "id": 1},
                {"name": "Test Workflow", "id": 2},
                {"name": "Deploy Workflow", "id": 3},
                {"name": "Build Workflow", "id": 4},  # Duplicate name
            ]
        )
        with (
            patch(
                "infrastructure.base_repository.BaseRepository.read_file_if_exists",
                return_value=workflows_with_duplicates,
            ),
        ):
            loader = LoadWorkflows(configuration=InMemoryConfiguration("."))
            result = loader.get_unique_workflow_names()
            assert len(result) == 3

    @pytest.mark.parametrize(
        "filters, expected",
        [
            (
                {"event": "push"},
                {
                    "count": 1,
                },
            ),
            (
                {"start_date": "2023-10-01", "end_date": "2023-10-01"},
                {
                    "count": 1,
                },
            ),
            (
                {
                    "start_date": "2023-10-01",
                    "end_date": "2023-10-01",
                    "event": "pull_request",
                },
                {
                    "count": 0,
                },
            ),
            (
                {"target_branch": "main"},
                {
                    "count": 1,
                },
            ),
            (
                {"workflow_path": "non-existent.yml"},
                {
                    "count": 0,
                },
            ),
            (
                {"include_defined_only": "true"},
                {
                    "count": 2,
                },
            ),
            (
                {"status": "completed"},
                {
                    "count": 1,
                },
            ),
            (
                {"conclusion": "success"},
                {
                    "count": 1,
                },
            ),
        ],
    )
    def test_filter_workflows_by(self, filters, expected):
        workflow_list = as_json_string(workflows_data())
        with (
            patch(
                "infrastructure.base_repository.BaseRepository.read_file_if_exists",
                return_value=workflow_list,
            ),
        ):
            loader = LoadWorkflows(configuration=InMemoryConfiguration("."))
            result = loader.runs(filters=filters)
            assert expected["count"] == len(result)

    def test_get_unique_workflow_paths(self):
        workflows_with_duplicated_paths = as_json_string(
            [
                {"path": "/workflows/build.yml", "id": 1},
                {"path": "/workflows/test.yml", "id": 2},
                {"path": "/workflows/deploy.yml", "id": 3},
                {"path": "/workflows/build.yml", "id": 4},
                {"path": "/workflows/build.yml", "id": 5},
            ]
        )
        with (
            patch(
                "infrastructure.base_repository.BaseRepository.read_file_if_exists",
                return_value=workflows_with_duplicated_paths,
            ),
        ):
            loader = LoadWorkflows(configuration=InMemoryConfiguration("."))

            result = loader.get_unique_workflow_paths()
            assert len(result) == 4

    def test_adds_all_option_by_default(self):
        empty_workflow_runs = as_json_string([])
        with (
            patch(
                "infrastructure.base_repository.BaseRepository.read_file_if_exists",
                return_value=empty_workflow_runs,
            ),
        ):
            loader = LoadWorkflows(configuration=InMemoryConfiguration("."))

            result = loader.get_unique_workflow_paths()
            assert result[0] == "All"

    def test_show_empty_deployment_frequency_when_no_data(self):
        empty_workflow_runs = as_json_string([])
        with (
            patch(
                "infrastructure.base_repository.BaseRepository.read_file_if_exists",
                return_value=empty_workflow_runs,
            ),
        ):
            loader = LoadWorkflows(configuration=InMemoryConfiguration("."))

            result = loader.get_deployment_frequency_for_job(
                job_name="Deploy", filters=None
            )
            assert 0 == len(result["months"])
            assert 0 == len(result["weeks"])
            assert 0 == len(result["weekly_counts"])
            assert 0 == len(result["monthly_counts"])

    def test_deployment_frequency(self):
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
            "infrastructure.base_repository.BaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            loader = LoadWorkflows(configuration=InMemoryConfiguration("."))

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
            "infrastructure.base_repository.BaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            loader = LoadWorkflows(configuration=InMemoryConfiguration("."))

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
            "infrastructure.base_repository.BaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            loader = LoadWorkflows(configuration=InMemoryConfiguration("."))

            result = loader.get_deployment_frequency_for_job(
                job_name="Deploy", filters=None
            )

            assert 0 == len(result["months"])
            assert 0 == len(result["weeks"])
            assert 0 == len(result["weekly_counts"])
            assert 0 == len(result["monthly_counts"])

    def test_compute_runs_duration(self):
        single_run = as_json_string(
            [
                {
                    "id": 1,
                    "path": "/workflows/build.yml",
                    "status": "success",
                    "created_at": "2023-10-01T09:00:00Z",
                    "updated_at": "2023-10-01T09:10:00Z",
                },
            ]
        )

        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return single_run
            return None

        with patch(
            "infrastructure.base_repository.BaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            loader = LoadWorkflows(configuration=InMemoryConfiguration("."))

            data = loader.get_workflows_run_duration()
            result = data["rows"]

            name = result[0][0]
            count = result[0][1]
            avg_min = result[0][2]
            total_min = result[0][3]

            assert 1 == len(result)
            assert "/workflows/build.yml" == name
            assert 1 == count
            assert 10.0 == avg_min
            assert 10.0 == total_min
