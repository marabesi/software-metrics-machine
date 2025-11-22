from unittest.mock import patch

import pytest

from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)
from tests.builders import as_json_string, github_workflows_data
from tests.in_memory_configuration import InMemoryConfiguration
from tests.pipeline_builder import PipelineJobBuilder


class TestPipelinesRepository:

    @pytest.fixture(scope="function", autouse=True)
    def reset_mocks(self):
        with patch(
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists"
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
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
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
                    "count": 2,
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
        workflow_list = as_json_string(github_workflows_data())
        with (
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
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
                return as_json_string(github_workflows_data())
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
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
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
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
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
                return as_json_string(github_workflows_data())
            elif file == "jobs.json":
                return as_json_string(jobs_with_duplicated_paths)
            raise FileNotFoundError(f"File {file} not found")

        with patch(
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            result = loader.get_unique_jobs_name()
            assert len(result) == 3

    def test_get_unique_jobs_name_filtered_by_pipeline(self):
        pipelines = github_workflows_data()
        jobs_with_duplicated_paths = [
            {
                "id": 1,
                "run_id": pipelines[0]["id"],
                "name": "Build",
            },
            {
                "id": 2,
                "run_id": pipelines[1]["id"],
                "name": "Deploy",
            },
        ]

        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string(pipelines)
            elif file == "jobs.json":
                return as_json_string(jobs_with_duplicated_paths)
            raise FileNotFoundError(f"File {file} not found")

        with patch(
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            filter_by = pipelines[0]["path"]
            filters = {"path": filter_by}

            result = loader.get_unique_jobs_name(filters=filters)

            assert len(result) == 2
            assert "Build" == result[1]

    def test_get_unique_pipelines_conclusions(self):
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
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
                return_value=workflows_with_duplicated_paths,
            ),
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            result = loader.get_unique_workflow_conclusions()
            assert len(result) == 3

    def test_get_unique_conclusions_ignores_empty(self):
        workflows_with_duplicated_paths = as_json_string(
            [
                {"conclusion": "success", "path": "/workflows/build.yml", "id": 1},
                {"conclusion": None, "path": "/workflows/deploy.yml", "id": 3},
            ]
        )
        with (
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
                return_value=workflows_with_duplicated_paths,
            ),
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            result = loader.get_unique_workflow_conclusions()
            assert len(result) == 2

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
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
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
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
                return_value=workflows_with_duplicated_paths,
            ),
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            result = loader.get_unique_workflow_conclusions()
            assert result[0] == "All"

    def test_get_unique_conclusions_applies_run_filters(self):
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
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
                return_value=workflows_with_duplicated_paths,
            ),
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            result = loader.get_unique_workflow_conclusions(
                {"path": "/workflows/test.yml"}
            )

            assert len(result) == 2
            assert result[1] == "in_progress"

    def test_get_unique_events(self):
        pipeline_run_with_duplicated_events = as_json_string(
            [
                {
                    "event": "push",
                    "conclusion": "success",
                    "path": "/workflows/build.yml",
                    "id": 1,
                },
                {
                    "event": "schedule",
                    "conclusion": "in_progress",
                    "path": "/workflows/test.yml",
                    "id": 2,
                },
                {
                    "event": "push",
                    "conclusion": "in_progress",
                    "path": "/workflows/deploy.yml",
                    "id": 3,
                },
                {
                    "event": "push",
                    "conclusion": "in_progress",
                    "path": "/workflows/build.yml",
                    "id": 4,
                },
                {
                    "event": "push",
                    "conclusion": "in_progress",
                    "path": "/workflows/build.yml",
                    "id": 5,
                },
            ]
        )
        with (
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
                return_value=pipeline_run_with_duplicated_events,
            ),
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            result = loader.get_unique_pipeline_trigger_events()

            assert len(result) == 3

    def test_get_unique_events_with_all_set(self):
        pipeline_run_with_duplicated_events = as_json_string(
            [
                {
                    "event": "push",
                    "conclusion": "success",
                    "path": "/workflows/build.yml",
                    "id": 1,
                },
                {
                    "event": "schedule",
                    "conclusion": "in_progress",
                    "path": "/workflows/test.yml",
                    "id": 2,
                },
                {
                    "event": "push",
                    "conclusion": "in_progress",
                    "path": "/workflows/deploy.yml",
                    "id": 3,
                },
                {
                    "event": "push",
                    "conclusion": "in_progress",
                    "path": "/workflows/build.yml",
                    "id": 4,
                },
                {
                    "event": "push",
                    "conclusion": "in_progress",
                    "path": "/workflows/build.yml",
                    "id": 5,
                },
            ]
        )
        with (
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
                return_value=pipeline_run_with_duplicated_events,
            ),
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            result = loader.get_unique_pipeline_trigger_events()

            assert result[0] == "All"

    def test_set_all_option_for_unique_pipeline_status(self):
        workflows_with_duplicated_paths = as_json_string([])
        with (
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
                return_value=workflows_with_duplicated_paths,
            ),
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            result = loader.get_unique_workflow_status()
            assert result[0] == "All"

    def test_get_unique_pipeline_status(self):
        workflows_with_duplicated_paths = as_json_string(
            [
                {"status": "completed", "path": "/workflows/build.yml", "id": 1},
                {"status": "in_progress", "path": "/workflows/test.yml", "id": 2},
            ]
        )
        with (
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
                return_value=workflows_with_duplicated_paths,
            ),
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            result = loader.get_unique_workflow_status()

            assert result[1] == "completed"
            assert result[2] == "in_progress"

    def test_adds_all_option_by_default(self):
        empty_workflow_runs = as_json_string([])
        with (
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
                return_value=empty_workflow_runs,
            ),
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            result = loader.get_unique_workflow_paths()
            assert result[0] == "All"

    def test_compute_runs_duration_for_a_pipeline_run(self):
        single_run = as_json_string(
            [
                {
                    "id": 1,
                    "path": "/workflows/build.yml",
                    "status": "success",
                    "created_at": "2023-10-01T09:00:00Z",
                    "run_started_at": "2023-10-01T09:00:00Z",
                    "updated_at": "2023-10-01T09:10:00Z",
                },
            ]
        )

        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return single_run
            if file == "jobs.json":
                return as_json_string(
                    [
                        PipelineJobBuilder()
                        .with_run_id(1)
                        .with_started_at("2023-10-01T09:00:00Z")
                        .with_completed_at("2023-10-01T09:10:00Z")
                        .build()
                    ]
                )
            return None

        with patch(
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
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

    def test_compute_runs_duration_grouped_by_pipeline_run(self):
        runs = as_json_string(
            [
                {
                    "id": 1,
                    "path": "/workflows/build.yml",
                    "status": "completed",
                    "created_at": "2023-10-01T09:00:00Z",
                    "run_started_at": "2023-10-01T09:00:00Z",
                    "updated_at": "2023-10-01T09:10:00Z",
                },
                {
                    "id": 2,
                    "path": "/workflows/test.yml",
                    "status": "completed",
                    "created_at": "2023-10-01T09:00:00Z",
                    "run_started_at": "2023-10-01T09:00:00Z",
                    "updated_at": "2023-10-01T09:10:00Z",
                },
            ]
        )

        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return runs
            if file == "jobs.json":
                return as_json_string(
                    [
                        PipelineJobBuilder()
                        .with_run_id(1)
                        .with_started_at("2023-10-01T09:00:00Z")
                        .with_completed_at("2023-10-01T09:10:00Z")
                        .build(),
                        PipelineJobBuilder()
                        .with_run_id(2)
                        .with_started_at("2023-10-01T09:00:00Z")
                        .with_completed_at("2023-10-01T09:10:00Z")
                        .build(),
                    ]
                )
            return None

        with patch(
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            data = loader.get_workflows_run_duration()
            result = data["rows"]

            total_runs = result
            assert 1 == total_runs[0][1]
            assert 1 == total_runs[1][1]

    @pytest.mark.parametrize(
        "pipeline_runs, expected",
        [
            (
                {
                    "pipelines": [
                        {
                            "id": 1,
                            "path": "/workflows/build.yml",
                            "conclusion": "success",
                            "created_at": "2023-10-01T09:00:00Z",
                            "updated_at": "2023-10-01T09:10:00Z",
                        },
                        {
                            "id": 2,
                            "path": "/workflows/test.yml",
                            "conclusion": "failure",
                            "created_at": "2023-10-01T09:00:00Z",
                            "updated_at": "2023-10-01T09:10:00Z",
                        },
                    ]
                },
                [{"pipeline_name": "/workflows/test.yml", "failed": 1}],
            ),
            (
                {
                    "pipelines": [
                        {
                            "id": 1,
                            "path": "/workflows/ci.yml",
                            "conclusion": "failure",
                            "created_at": "2023-10-01T09:00:00Z",
                            "updated_at": "2023-10-01T09:10:00Z",
                        },
                        {
                            "id": 2,
                            "path": "/workflows/ci.yml",
                            "conclusion": "failure",
                            "created_at": "2023-10-01T09:00:00Z",
                            "updated_at": "2023-10-01T09:10:00Z",
                        },
                    ]
                },
                [{"pipeline_name": "/workflows/ci.yml", "failed": 2}],
            ),
            ({"pipelines": []}, []),
            (
                {
                    "pipelines": [
                        {
                            "id": 1,
                            "path": "/workflows/ci.yml",
                            "conclusion": "failure",
                            "created_at": "2023-10-01T09:00:00Z",
                            "updated_at": "2023-10-01T09:10:00Z",
                        },
                        {
                            "id": 2,
                            "path": "/workflows/ci.yml",
                            "conclusion": "failure",
                            "created_at": "2023-10-01T09:00:00Z",
                            "updated_at": "2023-10-01T09:10:00Z",
                        },
                        {
                            "id": 3,
                            "path": "/workflows/e2e.yml",
                            "conclusion": "failure",
                            "created_at": "2023-10-01T09:00:00Z",
                            "updated_at": "2023-10-01T09:10:00Z",
                        },
                        {
                            "id": 4,
                            "path": "/workflows/e2e.yml",
                            "conclusion": "failure",
                            "created_at": "2023-10-01T09:00:00Z",
                            "updated_at": "2023-10-01T09:10:00Z",
                        },
                    ]
                },
                [
                    {"pipeline_name": "/workflows/e2e.yml", "failed": 2},
                    {"pipeline_name": "/workflows/ci.yml", "failed": 2},
                ],
            ),
        ],
    )
    def test_computes_the_pipeline_that_failes_the_most(self, pipeline_runs, expected):
        pipeline_runs = as_json_string(pipeline_runs["pipelines"])

        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return pipeline_runs
            return None

        with patch(
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            data = loader.get_pipeline_fails_the_most(
                {"start_date": "2023-01-01", "end_date": "2023-12-31"}
            )

            assert expected == data
