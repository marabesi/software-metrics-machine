import pytest
from software_metrics_machine.apps.cli import main

from tests.builders import github_workflows_data
from tests.pipeline_builder import PipelineBuilder


class TestWorkflowsRunsDurationCliCommands:

    @pytest.mark.parametrize(
        "workflow_runs, expected",
        [
            (
                github_workflows_data(),
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
    def test_should_run_duration_for_a_workflow(self, cli, workflow_runs, expected):
        expected_count = expected["count"]
        command = expected["command"]

        cli.storage.store_pipelines_with(workflow_runs)

        result = cli.runner.invoke(
            main,
            command,
        )

        assert expected_count in result.output

    @pytest.mark.parametrize(
        "workflow_runs, expected",
        [
            (
                github_workflows_data(),
                {
                    "command": [
                        "pipelines",
                        "runs-duration",
                        "--raw-filters",
                        "status=completed",
                    ],
                    "count": "dynamic/workflows/dependabot   60.0      1",
                },
            ),
            (
                github_workflows_data(),
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
            (
                [
                    PipelineBuilder()
                    .with_id(1)
                    .with_path("/workflows/tests.yml")
                    .with_status("completed")
                    .with_conclusion("failure")
                    .with_run_started_at("2023-10-01T12:00:00Z")
                    .add_job(
                        name="test-job",
                        conclusion="failure",
                        started_at="2023-10-01T12:00:00Z",
                        completed_at="2023-10-01T13:00:00Z",
                    )
                    .build(),
                    PipelineBuilder()
                    .with_id(1)
                    .with_path("/workflows/build.yml")
                    .with_status("completed")
                    .with_conclusion("failure")
                    .with_run_started_at("2023-10-01T12:00:00Z")
                    .add_job(
                        name="test-job",
                        conclusion="failure",
                        started_at="2023-10-01T12:00:00Z",
                        completed_at="2023-10-01T13:00:00Z",
                    )
                    .build(),
                ],
                {
                    "command": [
                        "pipelines",
                        "runs-duration",
                    ],
                    "count": "/workflows/tests.yml   60.0      1           1",
                },
            ),
            pytest.param(
                [
                    PipelineBuilder()
                    .with_id(1)
                    .with_path("/workflows/tests.yml")
                    .with_status("completed")
                    .with_conclusion("failure")
                    .with_run_started_at("2023-10-01T12:00:00Z")
                    .add_job(
                        name="test-job",
                        conclusion="failure",
                        started_at="2023-10-01T12:00:00Z",
                        completed_at="2023-10-01T13:00:00Z",
                    )
                    .build(),
                    PipelineBuilder()
                    .with_id(1)
                    .with_path("/workflows/tests.yml")
                    .with_status("completed")
                    .with_conclusion("failure")
                    .with_run_started_at("2023-10-01T12:00:00Z")
                    .add_job(
                        name="test-job",
                        conclusion="failure",
                        started_at="2023-10-01T12:00:00Z",
                        completed_at="2023-10-01T13:00:00Z",
                    )
                    .build(),
                ],
                {
                    "command": [
                        "pipelines",
                        "runs-duration",
                    ],
                    "count": "/workflows/tests.yml   60.0      2           2",
                },
                id="aggregate multiple runs for the same workflow and show total",
            ),
            pytest.param(
                [
                    PipelineBuilder()
                    .with_id(1)
                    .with_path("/workflows/tests.yml")
                    .with_status("completed")
                    .with_conclusion("failure")
                    .with_created_at("2023-10-01T12:00:00Z")
                    .with_run_started_at("2023-10-01T12:00:00Z")
                    .add_job(
                        name="test-job",
                        conclusion="failure",
                        started_at="2023-10-01T12:00:00Z",
                        completed_at="2023-10-01T13:00:00Z",
                    )
                    .build(),
                    PipelineBuilder()
                    .with_id(2)
                    .with_path("/workflows/tests.yml")
                    .with_status("completed")
                    .with_conclusion("failure")
                    .with_created_at("2023-10-01T12:00:00Z")
                    .with_run_started_at("2023-10-01T12:00:00Z")
                    .add_job(
                        name="test-job",
                        conclusion="failure",
                        started_at="2023-10-01T12:00:00Z",
                        completed_at="2023-10-01T13:00:00Z",
                    )
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
                        "--aggregate-by-day",
                        "true",
                    ],
                    "count": "2023-10-01   60.0      2           2",
                },
                id="aggregate multiple runs for the same workflow and show total by day",
            ),
        ],
    )
    def test_should_filter_pipeline_run_duration_by_raw_filters(
        self, cli, workflow_runs, expected
    ):
        expected_count = expected["count"]
        command = expected["command"]

        cli.storage.store_pipelines_with(workflow_runs)

        result = cli.runner.invoke(
            main,
            command,
        )

        assert expected_count in result.output

    @pytest.mark.parametrize(
        "workflow_runs, expected",
        [
            (
                github_workflows_data(),
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
    def test_should_print_result_in_minutes(self, cli, workflow_runs, expected):
        command = expected["command"]

        cli.storage.store_pipelines_with(workflow_runs)

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

        result = cli.runner.invoke(
            main,
            ["pipelines", "runs-duration", "--aggregate-by-day", "false"],
        )

        assert expected in result.output
