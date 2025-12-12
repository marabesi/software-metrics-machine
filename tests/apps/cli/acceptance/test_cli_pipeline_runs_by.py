import pytest
from software_metrics_machine.apps.cli import main

from tests.builders import github_workflows_data


class TestWorkflowsRunsByCliCommands:

    def test_show_filter_instructions(self, cli):
        result = cli.runner.invoke(main, ["pipelines", "runs-by", "--help"])
        assert "Comma-separated key=value pairs to filter runs" in result.output

    @pytest.mark.parametrize(
        "workflow_runs, expected",
        [
            (
                github_workflows_data(),
                {"target": "main", "count": 1},
            ),
            ([], {"target": "main", "count": 0}),
            (
                github_workflows_data(),
                {"target": "main,master", "count": 1},  # ignores second after comma
            ),
        ],
    )
    def test_should_filter_workflows_by_target_branch(
        self, cli, workflow_runs, expected
    ):
        target = expected["target"]
        expected_count = expected["count"]

        cli.storage.store_pipelines_with(workflow_runs)

        result = cli.runner.invoke(
            main,
            [
                "pipelines",
                "runs-by",
                "--start-date",
                "2023-10-01",
                "--end-date",
                "2023-10-01",
                "--raw-filters",
                f"target_branch={target}",
            ],
        )

        assert f"Found {expected_count} runs after filtering" in result.output

    def test_should_filter_by_workflow_path(self, cli):
        workflow_runs = github_workflows_data()
        cli.storage.store_pipelines_with(workflow_runs)

        result = cli.runner.invoke(
            main,
            [
                "pipelines",
                "runs-by",
                "--workflow-path",
                "/workflows/tests.yml",
            ],
        )

        assert "Found 1 runs after filtering" in result.output

    def test_should_aggregate_data_by_week_by_default(
        self,
        cli,
    ):
        workflow_runs = github_workflows_data()
        cli.storage.store_pipelines_with(workflow_runs)

        result = cli.runner.invoke(
            main,
            [
                "pipelines",
                "runs-by",
            ],
        )

        assert "Plotting data aggregated by week" in result.output

    def test_should_aggregate_data_by_month(self, cli):
        workflow_runs = github_workflows_data()

        cli.storage.store_pipelines_with(workflow_runs)

        result = cli.runner.invoke(
            main,
            [
                "pipelines",
                "runs-by",
                "--aggregate-by",
                "month",
            ],
        )

        assert "Plotting data aggregated by month" in result.output

    @pytest.mark.parametrize(
        "workflow_runs, expected",
        [
            (
                github_workflows_data(),
                {"event": "event=push", "count": 1},
            ),
            ([], {"event": "event=push", "count": 0}),
            (
                github_workflows_data(),
                {"event": "conclusion=success", "count": 3},
            ),
        ],
    )
    def test_should_filter_workflows_by_events(self, cli, workflow_runs, expected):
        event = expected["event"]
        expected_count = expected["count"]

        cli.storage.store_pipelines_with(workflow_runs)

        result = cli.runner.invoke(
            main,
            [
                "pipelines",
                "runs-by",
                "--start-date",
                "2000-10-01",
                "--end-date",
                "2200-10-01",
                "--raw-filters",
                event,
            ],
        )

        assert f"Found {expected_count} runs after filtering" in result.output

    @pytest.mark.parametrize(
        "command, expected",
        [
            pytest.param(
                [
                    "pipelines",
                    "runs-by",
                    "--start-date",
                    "2023-10-01",
                    "--end-date",
                    "2023-10-01",
                    "--raw-filters",
                    "event=pull_request,conclusion=failure",
                ],
                {
                    "count": 0,
                },
                id="should_filter_by_pull_requests",
            ),
            pytest.param(
                [
                    "pipelines",
                    "runs-by",
                    "--start-date",
                    "2023-10-01",
                    "--end-date",
                    "2023-12-01",
                    "--include-defined-only",
                ],
                {
                    "count": 2,
                },
                id="should_filter_by_defined_only",
            ),
            pytest.param(
                [
                    "pipelines",
                    "runs-by",
                    "--raw-filters",
                    "conclusion=action_required",
                ],
                {
                    "count": 1,
                },
                id="should_filter_by_conclusion",
            ),
        ],
    )
    def test_should_filter_by_multiple_parameters(self, cli, command, expected):
        expected_count = expected["count"]
        workflow_runs = github_workflows_data()

        cli.storage.store_pipelines_with(workflow_runs)

        result = cli.runner.invoke(main, command)

        assert f"Found {expected_count} runs after filtering" in result.output
