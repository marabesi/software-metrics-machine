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

            # ensure filtering by runs is supported
            filtered = loader.get_unique_workflow_paths(
                filters={"path": "/workflows/build.yml"}
            )
            assert len(filtered) == 2
            assert filtered[1] == "/workflows/build.yml"

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

    @pytest.mark.parametrize(
        "filters, expected",
        [
            (
                {"path": "/workflows/tests.yml"},
                {
                    "count": 2,  # adds the "All" option
                    "job_name": "Build",
                },
            ),
            pytest.param(
                None,
                {
                    "count": 3,  # adds the "All" option
                    "job_name": "Build",
                },
            ),
        ],
    )
    def test_get_unique_jobs_name_filtered_by_pipeline(self, filters, expected):
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

            result = loader.get_unique_jobs_name(filters=filters)

            assert expected["count"] == len(result)
            assert expected["job_name"] == result[1]

    def test_get_unique_pipelines_conclusions(self):
        pipelines = [
            PipelineBuilder()
            .with_id(1)
            .with_conclusion("success")
            .with_path("/workflows/build.yml")
            .build(),
            PipelineBuilder()
            .with_id(2)
            .with_conclusion("in_progress")
            .with_path("/workflows/test.yml")
            .build(),
            PipelineBuilder()
            .with_id(3)
            .with_conclusion("in_progress")
            .with_path("/workflows/deploy.yml")
            .build(),
            PipelineBuilder()
            .with_id(4)
            .with_conclusion("in_progress")
            .with_path("/workflows/build.yml")
            .build(),
            PipelineBuilder()
            .with_id(5)
            .with_conclusion("in_progress")
            .with_path("/workflows/build.yml")
            .build(),
        ]

        with (
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
                side_effect=lambda file: mocked_read_file_if_exists(file, pipelines),
            ),
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            result = loader.get_unique_workflow_conclusions()
            assert len(result) == 3

    def test_get_unique_conclusions_ordered_by_asc(self):
        pipelines = [
            PipelineBuilder()
            .with_id(1)
            .with_conclusion("success")
            .with_path("/workflows/build.yml")
            .build(),
            PipelineBuilder()
            .with_id(2)
            .with_conclusion("in_progress")
            .with_path("/workflows/test.yml")
            .build(),
            PipelineBuilder()
            .with_id(3)
            .with_conclusion("in_progress")
            .with_path("/workflows/deploy.yml")
            .build(),
            PipelineBuilder()
            .with_id(4)
            .with_conclusion("in_progress")
            .with_path("/workflows/build.yml")
            .build(),
            PipelineBuilder()
            .with_id(5)
            .with_conclusion("in_progress")
            .with_path("/workflows/build.yml")
            .build(),
        ]

        with (
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
                side_effect=lambda file: mocked_read_file_if_exists(file, pipelines),
            ),
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            result = loader.get_unique_workflow_conclusions()

            assert result[0] == "All"
            assert result[1] == "in_progress"
            assert result[2] == "success"

    def test_set_all_option_for_unique_conclusions(self):
        pipelines = [
            PipelineBuilder()
            .with_id(1)
            .with_conclusion("success")
            .with_path("/workflows/build.yml")
            .build(),
            PipelineBuilder()
            .with_id(2)
            .with_conclusion("in_progress")
            .with_path("/workflows/test.yml")
            .build(),
        ]
        with (
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
                side_effect=lambda file: mocked_read_file_if_exists(file, pipelines),
            ),
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            result = loader.get_unique_workflow_conclusions()
            assert result[0] == "All"

    def test_get_unique_conclusions_applies_run_filters(self):
        pipelines = [
            PipelineBuilder()
            .with_id(1)
            .with_conclusion("success")
            .with_path("/workflows/build.yml")
            .build(),
            PipelineBuilder()
            .with_id(2)
            .with_conclusion("in_progress")
            .with_path("/workflows/test.yml")
            .build(),
            PipelineBuilder()
            .with_id(3)
            .with_conclusion("in_progress")
            .with_path("/workflows/deploy.yml")
            .build(),
            PipelineBuilder()
            .with_id(4)
            .with_conclusion("in_progress")
            .with_path("/workflows/build.yml")
            .build(),
            PipelineBuilder()
            .with_id(5)
            .with_conclusion("in_progress")
            .with_path("/workflows/build.yml")
            .build(),
        ]
        with (
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
                side_effect=lambda file: mocked_read_file_if_exists(file, pipelines),
            ),
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            result = loader.get_unique_workflow_conclusions(
                {"path": "/workflows/test.yml"}
            )

            assert len(result) == 2
            assert result[1] == "in_progress"

    def test_get_unique_events(self):
        pipelines = [
            PipelineBuilder()
            .with_id(1)
            .with_event("push")
            .with_path("/workflows/build.yml")
            .with_conclusion("success")
            .build(),
            PipelineBuilder()
            .with_id(2)
            .with_event("schedule")
            .with_path("/workflows/test.yml")
            .with_conclusion("in_progress")
            .build(),
            PipelineBuilder()
            .with_id(3)
            .with_event("push")
            .with_path("/workflows/deploy.yml")
            .with_conclusion("in_progress")
            .build(),
            PipelineBuilder()
            .with_id(4)
            .with_event("push")
            .with_path("/workflows/build.yml")
            .with_conclusion("in_progress")
            .build(),
            PipelineBuilder()
            .with_id(5)
            .with_event("push")
            .with_path("/workflows/build.yml")
            .with_conclusion("in_progress")
            .build(),
        ]
        with (
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
                side_effect=lambda file: mocked_read_file_if_exists(file, pipelines),
            ),
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            result = loader.get_unique_pipeline_trigger_events()

            assert len(result) == 3

    def test_get_unique_events_with_all_set(self):
        pipelines = [
            PipelineBuilder()
            .with_id(1)
            .with_event("push")
            .with_path("/workflows/build.yml")
            .with_conclusion("success")
            .build(),
            PipelineBuilder()
            .with_id(2)
            .with_event("schedule")
            .with_path("/workflows/test.yml")
            .with_conclusion("in_progress")
            .build(),
            PipelineBuilder()
            .with_id(3)
            .with_event("push")
            .with_path("/workflows/deploy.yml")
            .with_conclusion("in_progress")
            .build(),
            PipelineBuilder()
            .with_id(4)
            .with_event("push")
            .with_path("/workflows/build.yml")
            .with_conclusion("in_progress")
            .build(),
            PipelineBuilder()
            .with_id(5)
            .with_event("push")
            .with_path("/workflows/build.yml")
            .with_conclusion("in_progress")
            .build(),
        ]
        with (
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
                side_effect=lambda file: mocked_read_file_if_exists(file, pipelines),
            ),
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            result = loader.get_unique_pipeline_trigger_events()

            assert result[0] == "All"

    def test_set_all_option_for_unique_pipeline_status(self):
        with (
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
                return_value=as_json_string([]),
            ),
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            result = loader.get_unique_workflow_status()
            assert result[0] == "All"

    def test_get_unique_pipeline_status(self):
        pipelines = [
            PipelineBuilder()
            .with_id(1)
            .with_status("completed")
            .with_path("/workflows/build.yml")
            .build(),
            PipelineBuilder()
            .with_id(2)
            .with_status("in_progress")
            .with_path("/workflows/test.yml")
            .build(),
        ]
        with (
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
                side_effect=lambda file: mocked_read_file_if_exists(file, pipelines),
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
                PipelineBuilder()
                .with_id(1)
                .with_path("/workflows/build.yml")
                .with_status("success")
                .with_created_at("2023-10-01T09:00:00Z")
                .with_run_started_at("2023-10-01T09:00:00Z")
                .with_updated_at("2023-10-01T09:10:00Z")
                .build()
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
                        PipelineBuilder()
                        .with_id(1)
                        .with_path("/workflows/build.yml")
                        .with_status("success")
                        .with_created_at("2023-10-01T09:00:00Z")
                        .with_run_started_at("2023-10-01T09:00:00Z")
                        .with_updated_at("2023-10-01T09:10:00Z")
                        .build(),
                        PipelineBuilder()
                        .with_id(2)
                        .with_path("/workflows/test.yml")
                        .with_status("failure")
                        .with_conclusion("failure")
                        .with_created_at("2023-10-01T09:00:00Z")
                        .with_run_started_at("2023-10-01T09:00:00Z")
                        .with_updated_at("2023-10-01T09:10:00Z")
                        .build(),
                    ]
                },
                [{"pipeline_name": "/workflows/test.yml", "failed": 1}],
            ),
            (
                {
                    "pipelines": [
                        PipelineBuilder()
                        .with_id(1)
                        .with_path("/workflows/ci.yml")
                        .with_status("failure")
                        .with_conclusion("failure")
                        .with_created_at("2023-10-01T09:00:00Z")
                        .with_run_started_at("2023-10-01T09:00:00Z")
                        .with_updated_at("2023-10-01T09:10:00Z")
                        .build(),
                        PipelineBuilder()
                        .with_id(2)
                        .with_path("/workflows/ci.yml")
                        .with_status("failure")
                        .with_conclusion("failure")
                        .with_created_at("2023-10-01T09:00:00Z")
                        .with_run_started_at("2023-10-01T09:00:00Z")
                        .with_updated_at("2023-10-01T09:10:00Z")
                        .build(),
                    ]
                },
                [{"pipeline_name": "/workflows/ci.yml", "failed": 2}],
            ),
            ({"pipelines": []}, []),
            (
                {
                    "pipelines": [
                        PipelineBuilder()
                        .with_id(1)
                        .with_path("/workflows/ci.yml")
                        .with_status("failure")
                        .with_conclusion("failure")
                        .with_created_at("2023-10-01T09:00:00Z")
                        .with_run_started_at("2023-10-01T09:00:00Z")
                        .with_updated_at("2023-10-01T09:10:00Z")
                        .build(),
                        PipelineBuilder()
                        .with_id(2)
                        .with_path("/workflows/ci.yml")
                        .with_status("failure")
                        .with_conclusion("failure")
                        .with_created_at("2023-10-01T09:00:00Z")
                        .with_run_started_at("2023-10-01T09:00:00Z")
                        .with_updated_at("2023-10-01T09:10:00Z")
                        .build(),
                        PipelineBuilder()
                        .with_id(3)
                        .with_path("/workflows/e2e.yml")
                        .with_status("failure")
                        .with_conclusion("failure")
                        .with_created_at("2023-10-01T09:00:00Z")
                        .with_run_started_at("2023-10-01T09:00:00Z")
                        .with_updated_at("2023-10-01T09:10:00Z")
                        .build(),
                        PipelineBuilder()
                        .with_id(4)
                        .with_path("/workflows/e2e.yml")
                        .with_status("failure")
                        .with_conclusion("failure")
                        .with_created_at("2023-10-01T09:00:00Z")
                        .with_run_started_at("2023-10-01T09:00:00Z")
                        .with_updated_at("2023-10-01T09:10:00Z")
                        .build(),
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
        with patch(
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=lambda file: mocked_read_file_if_exists(
                file, pipeline_runs["pipelines"]
            ),
        ):
            loader = PipelinesRepository(configuration=InMemoryConfiguration("."))

            data = loader.get_pipeline_fails_the_most(
                {"start_date": "2023-01-01", "end_date": "2023-12-31"}
            )

            assert expected == data
