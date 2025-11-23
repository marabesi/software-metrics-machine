from unittest.mock import patch

import pytest

from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)
from tests.builders import as_json_string, github_workflows_data
from tests.in_memory_configuration import InMemoryConfiguration
from tests.pipeline_builder import PipelineBuilder, PipelineJobBuilder
from tests.builders import mocked_read_file_if_exists


class TestPipelinesRepository:

    @pytest.fixture(scope="function", autouse=True)
    def reset_mocks(self):
        with patch(
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists"
        ) as mock_exists:
            mock_exists.reset_mock()
            yield mock_exists

    def test_get_unique_workflow_names(self):
        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                workflows_with_duplicates = as_json_string(
                    [
                        PipelineBuilder()
                        .with_id(1)
                        .with_name("Build Workflow")
                        .build(),
                        PipelineBuilder().with_id(2).with_name("Test Workflow").build(),
                        PipelineBuilder()
                        .with_id(3)
                        .with_name("Deploy Workflow")
                        .build(),
                        PipelineBuilder()
                        .with_id(4)
                        .with_name("Build Workflow")
                        .build(),
                    ]
                )
                return workflows_with_duplicates
            if file == "jobs.json":
                return as_json_string([])
            raise FileNotFoundError(f"File {file} not found")

        with (
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
                side_effect=mocked_read_file_if_exists,
            ),
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))
            result = loader.get_unique_workflow_names()
            assert len(result) == 3

    @pytest.mark.parametrize(
        "filters, expected",
        [
            pytest.param(
                {"event": "push"},
                {
                    "count": 1,
                },
                id="filter_by_event",
            ),
            pytest.param(
                {"start_date": "2023-10-01", "end_date": "2023-10-01"},
                {
                    "count": 3,
                },
                id="filter_by_date",
            ),
            pytest.param(
                {
                    "start_date": "2023-10-01",
                    "end_date": "2023-10-01",
                    "event": "pull_request",
                },
                {
                    "count": 1,
                },
                id="filter_by_date_and_event",
            ),
            pytest.param(
                {"target_branch": "main"},
                {
                    "count": 1,
                },
                id="filter_by_target_branch",
            ),
            pytest.param(
                {"workflow_path": "non-existent.yml"},
                {
                    "count": 0,
                },
                id="filter_by_workflow_path",
            ),
            pytest.param(
                {"include_defined_only": "true"},
                {
                    "count": 2,
                },
                id="filter_by_include_defined_only",
            ),
            pytest.param(
                {"status": "completed"},
                {
                    "count": 4,
                },
                id="filter_by_status",
            ),
            pytest.param(
                {"conclusion": "success"},
                {
                    "count": 3,
                },
                id="filter_by_conclusion",
            ),
            pytest.param(
                {"conclusion": ""},
                {
                    "count": 5,
                },
                id="filter_by_empty_conclusion",
            ),
            pytest.param(
                {"path": "/workflows/tests.yml"},
                {
                    "count": 1,
                },
                id="filter_by_path",
            ),
        ],
    )
    def test_filter_workflows_by(self, filters, expected):
        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string(github_workflows_data())
            if file == "jobs.json":
                return as_json_string([])
            return None

        with (
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
                side_effect=mocked_read_file_if_exists,
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
                        PipelineJobBuilder()
                        .with_id(105)
                        .with_run_id(1)
                        .with_name("Deploy")
                        .with_conclusion("success")
                        .with_started_at("2023-10-01T09:05:00Z")
                        .with_completed_at("2023-10-01T09:10:00Z")
                        .build(),
                        PipelineJobBuilder()
                        .with_id(107)
                        .with_run_id(1)
                        .with_name("Build")
                        .with_conclusion("failed")
                        .with_started_at("2023-10-01T09:05:00Z")
                        .with_completed_at("2023-10-01T09:10:00Z")
                        .build(),
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
        workflows_with_duplicated_paths = [
            PipelineBuilder().with_path("/workflows/build.yml").build(),
            PipelineBuilder().with_path("/workflows/test.yml").build(),
            PipelineBuilder().with_path("/workflows/deploy.yml").build(),
            PipelineBuilder().with_path("/workflows/build.yml").build(),
            PipelineBuilder().with_path("/workflows/build.yml").build(),
        ]
        with (
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
                side_effect=lambda file: mocked_read_file_if_exists(
                    file, workflows_with_duplicated_paths
                ),
            ),
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            result = loader.get_unique_workflow_paths()
            assert len(result) == 4

    def test_get_unique_jobs_name(self):
        jobs_with_duplicated_names = [
            PipelineJobBuilder().with_name("Build").build(),
            PipelineJobBuilder().with_name("Deploy").build(),
            PipelineJobBuilder().with_name("Deploy").build(),
        ]

        with patch(
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=lambda file: mocked_read_file_if_exists(
                file, github_workflows_data(), jobs_with_duplicated_names
            ),
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            result = loader.get_unique_jobs_name()
            assert len(result) == 3

    def test_get_unique_jobs_name_filtered_by_pipeline(self):
        pipelines = github_workflows_data()
        jobs_with_duplicated_name = [
            PipelineJobBuilder()
            .with_id(1)
            .with_run_id(pipelines[0].id)
            .with_name("Build")
            .build(),
            PipelineJobBuilder()
            .with_id(2)
            .with_run_id(pipelines[1].id)
            .with_name("Deploy")
            .build(),
        ]

        with patch(
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=lambda file: mocked_read_file_if_exists(
                file, pipelines, jobs_with_duplicated_name
            ),
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            filter_by = pipelines[0].path
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

    def test_compute_runs_duration(self):
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
            result = data.rows

            name = result[0][0]
            count = result[0][1]
            avg_min = result[0][2]
            total_min = result[0][3]

            assert 1 == len(result)
            assert "/workflows/build.yml" == name
            assert 1 == count
            assert 10.0 == avg_min
            assert 10.0 == total_min

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
