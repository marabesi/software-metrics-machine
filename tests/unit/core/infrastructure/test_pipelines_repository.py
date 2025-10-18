from unittest.mock import patch

import pytest

from core.pipelines.pipelines_repository import PipelinesRepository
from tests.builders import as_json_string, workflows_data
from tests.in_memory_configuration import InMemoryConfiguration


class TestPipelinesRepository:

    @pytest.fixture(scope="function", autouse=True)
    def reset_mocks(self):
        with patch(
            "core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists"
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
                "core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
                return_value=workflows_with_duplicates,
            ),
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))
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
            (
                {"conclusion": ""},
                {
                    "count": 5,
                },
            ),
            (
                {"path": "/workflows/tests.yml"},
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
                "core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
                return_value=workflow_list,
            ),
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))
            result = loader.runs(filters=filters)
            assert expected["count"] == len(result)

    @pytest.mark.parametrize(
        "filters, expected",
        [
            (
                {"name": "Deploy"},
                {
                    "count": 1,
                },
            ),
            (
                {"name": "Banana"},
                {
                    "count": 0,
                },
            ),
            (
                {
                    "name": "Deploy",
                    "start_date": "2023-10-01",
                    "end_date": "2023-10-01",
                },
                {
                    "count": 1,
                },
            ),
        ],
    )
    def test_filter_jobs_by(self, filters, expected):
        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string(workflows_data())
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
            raise FileNotFoundError(f"File {file} not found")

        with patch(
            "core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))
            result = loader.jobs(filters=filters)

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
                "core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
                return_value=workflows_with_duplicated_paths,
            ),
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            result = loader.get_unique_workflow_paths()
            assert len(result) == 4

    def test_get_unique_jobs_name(self):
        jobs_with_duplicated_paths = [
            {
                "name": "Deploy",
            },
            {
                "name": "Deploy",
            },
            {
                "name": "Build",
            },
        ]

        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string(workflows_data())
            elif file == "jobs.json":
                return as_json_string(jobs_with_duplicated_paths)
            raise FileNotFoundError(f"File {file} not found")

        with patch(
            "core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            result = loader.get_unique_jobs_name()
            assert len(result) == 3

    def test_get_unique_conclusions(self):
        workflows_with_duplicated_paths = as_json_string(
            [
                {"conclusion": "success", "path": "/workflows/build.yml", "id": 1},
                {"conclusion": "in_progress", "path": "/workflows/test.yml", "id": 2},
                {"conclusion": "in_progress", "path": "/workflows/deploy.yml", "id": 3},
                {"conclusion": "in_progress", "path": "/workflows/build.yml", "id": 4},
                {"conclusion": "in_progress", "path": "/workflows/build.yml", "id": 5},
            ]
        )
        with (
            patch(
                "core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
                return_value=workflows_with_duplicated_paths,
            ),
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            result = loader.get_unique_workflow_conclusions()
            assert len(result) == 3

    def test_get_unique_conclusions_ordered_by_asc(self):
        workflows_with_duplicated_paths = as_json_string(
            [
                {"conclusion": "success", "path": "/workflows/build.yml", "id": 1},
                {"conclusion": "in_progress", "path": "/workflows/test.yml", "id": 2},
                {"conclusion": "in_progress", "path": "/workflows/deploy.yml", "id": 3},
                {"conclusion": "in_progress", "path": "/workflows/build.yml", "id": 4},
                {"conclusion": "in_progress", "path": "/workflows/build.yml", "id": 5},
            ]
        )
        with (
            patch(
                "core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
                return_value=workflows_with_duplicated_paths,
            ),
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            result = loader.get_unique_workflow_conclusions()

            assert result[0] == "All"
            assert result[1] == "in_progress"
            assert result[2] == "success"

    def test_set_all_option_for_unique_conclusions(self):
        workflows_with_duplicated_paths = as_json_string(
            [
                {"conclusion": "success", "path": "/workflows/build.yml", "id": 1},
                {"conclusion": "in_progress", "path": "/workflows/test.yml", "id": 2},
            ]
        )
        with (
            patch(
                "core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
                return_value=workflows_with_duplicated_paths,
            ),
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            result = loader.get_unique_workflow_conclusions()
            assert result[0] == "All"

    def test_adds_all_option_by_default(self):
        empty_workflow_runs = as_json_string([])
        with (
            patch(
                "core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
                return_value=empty_workflow_runs,
            ),
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            result = loader.get_unique_workflow_paths()
            assert result[0] == "All"

    def test_show_empty_deployment_frequency_when_no_data(self):
        empty_workflow_runs = as_json_string([])
        with (
            patch(
                "core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
                return_value=empty_workflow_runs,
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
            "core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

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

    def test_computes_the_pipeline_that_failes_the_most(self):
        single_run = as_json_string(
            [
                {
                    "id": 1,
                    "path": "/workflows/build.yml",
                    "status": "success",
                    "created_at": "2023-10-01T09:00:00Z",
                    "updated_at": "2023-10-01T09:10:00Z",
                },
                {
                    "id": 2,
                    "path": "/workflows/build.yml",
                    "status": "failure",
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
            "core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            data = loader.get_pipeline_fails_the_most(
                {"start_date": "2023-01-01", "end_date": "2023-12-31"}
            )

            assert "/workflow/build.yml" == data["pipeline_name"]
