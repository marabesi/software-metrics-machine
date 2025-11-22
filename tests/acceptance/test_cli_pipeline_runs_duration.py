import pytest
from software_metrics_machine.apps.cli import main

from tests.builders import github_workflows_data
from tests.pipeline_builder import PipelineBuilder, PipelineJobBuilder


class TestWorkflowsRunsDurationCliCommands:

    @pytest.mark.parametrize(
        "workflow_runs, jobs, expected",
        [
            (
                github_workflows_data(),
                [
                    PipelineJobBuilder()
                    .with_run_id(1)
                    .with_started_at("2023-10-01T12:00:00Z")
                    .with_completed_at("2023-10-01T13:00:00Z")
                    .build(),
                ],
                {
                    "command": [
                        "pipelines",
                        "runs-duration",
                        "--start-date",
                        "2023-10-01",
                        "--end-date",
                        "2023-10-01",
                    ],
                    "count": "/workflows/tests.yml   60.0      1",
                },
            ),
            (
                github_workflows_data(),
                [
                    PipelineJobBuilder()
                    .with_run_id(1)
                    .with_started_at("2023-10-01T12:00:00Z")
                    .with_completed_at("2023-10-01T13:00:00Z")
                    .build(),
                ],
                {
                    "command": [
                        "pipelines",
                        "runs-duration",
                        "--workflow-path",
                        "/workflows/tests.yml",
                    ],
                    "count": "/workflows/tests.yml   60.0      1",
                },
            ),
        ],
    )
    def test_should_run_duration_for_a_workflow(
        self, cli, workflow_runs, jobs, expected
    ):
        expected_count = expected["count"]
        command = expected["command"]

        cli.storage.store_pipelines_with(workflow_runs)
        cli.storage.store_jobs_with(jobs)

        result = cli.runner.invoke(
            main,
            command,
        )

        assert expected_count in result.output

    @pytest.mark.parametrize(
        "workflow_runs, jobs, expected",
        [
            (
                github_workflows_data(),
                [
                    PipelineJobBuilder()
                    .with_run_id(5)
                    .with_started_at("2023-10-01T12:00:00Z")
                    .with_completed_at("2023-10-01T13:00:00Z")
                    .build()
                ],
                {
                    "command": [
                        "pipelines",
                        "runs-duration",
                        "--raw-filters",
                        "status=failed",
                    ],
                    "count": "dynamic/workflows/dependabot   60.0      1",
                },
            ),
            (
                github_workflows_data(),
                [
                    PipelineJobBuilder()
                    .with_run_id(1)
                    .with_started_at("2023-10-01T12:00:00Z")
                    .with_completed_at("2023-10-01T13:00:00Z")
                    .build()
                ],
                {
                    "command": [
                        "pipelines",
                        "runs-duration",
                        "--raw-filters",
                        "conclusion=success",
                    ],
                    "count": "/workflows/tests.yml   60.0      1",
                },
            ),
        ],
    )
    def test_should_filter_by_raw_filters(self, cli, workflow_runs, jobs, expected):
        expected_count = expected["count"]
        command = expected["command"]

        cli.storage.store_pipelines_with(workflow_runs)
        cli.storage.store_jobs_with(jobs)

        result = cli.runner.invoke(
            main,
            command,
        )

        assert expected_count in result.output

    @pytest.mark.parametrize(
        "workflow_runs, jobs, expected",
        [
            (
                [
                    PipelineBuilder()
                    .with_id(3)
                    .with_path("dynamic/workflows/dependabot")
                    .with_status("completed")
                    .with_conclusion("success")
                    .with_created_at("2023-10-01T12:00:00Z")
                    .with_run_started_at("2023-10-01T12:00:00Z")
                    .with_updated_at("2023-10-01T13:00:00Z")
                    .with_head_branch("master")
                    .with_event("dependabot")
                    .with_jobs([])
                    .build(),
                ],
                [
                    PipelineJobBuilder()
                    .with_run_id(3)
                    .with_started_at("2023-10-01T12:00:00Z")
                    .with_completed_at("2023-10-01T13:00:00Z")
                    .build()
                ],
                {
                    "command": [
                        "pipelines",
                        "runs-duration",
                        "--raw-filters",
                        "status=completed",
                    ],
                    "output": "dynamic/workflows/dependabot   60.0      1",
                },
            ),
        ],
    )
    def test_should_print_result_in_minutes(self, cli, workflow_runs, jobs, expected):
        command = expected["command"]

        cli.storage.store_pipelines_with(workflow_runs)
        cli.storage.store_jobs_with(jobs)

        result = cli.runner.invoke(
            main,
            command,
        )

        assert expected["output"] in result.output

    @pytest.mark.parametrize(
        "expected",
        [
            pytest.param("/workflows/tests.yml   60.0      1"),
            pytest.param("/workflows/build.yml   60.0      1"),
            pytest.param("dynamic/workflows/dependabot   60.0      1"),
        ],
    )
    def test_return_results_aggregated_by_day_with_average_metric(self, cli, expected):
        workflow_runs = github_workflows_data()

        cli.storage.store_pipelines_with(workflow_runs)

        cli.storage.store_jobs_with(
            [
                PipelineJobBuilder()
                .with_run_id(1)
                .with_started_at("2023-10-01T12:00:00Z")
                .with_completed_at("2023-10-01T13:00:00Z")
                .build(),
                PipelineJobBuilder()
                .with_run_id(2)
                .with_started_at("2023-10-10T12:00:00Z")
                .with_completed_at("2023-10-10T13:00:00Z")
                .build(),
                PipelineJobBuilder()
                .with_run_id(3)
                .with_started_at("2023-10-01T12:00:00Z")
                .with_completed_at("2023-10-01T13:00:00Z")
                .build(),
            ]
        )

        result = cli.runner.invoke(
            main,
            ["pipelines", "runs-duration", "--aggregate-by-day", "false"],
        )

        assert expected in result.output
