import pytest
from apps.cli.main import main

from tests.builders import github_workflows_data
from tests.file_handler_for_testing import FileHandlerForTesting


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
                    "count": 1,
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
                    "count": 1,
                },
            ),
        ],
    )
    def test_should_run_duration_for_a_workflow(self, cli, workflow_runs, expected):
        expected_count = expected["count"]
        command = expected["command"]
        path_string = cli.data_stored_at

        FileHandlerForTesting(path_string).store_json_file(
            "workflows.json", workflow_runs
        )

        result = cli.runner.invoke(
            main,
            command,
        )

        assert f"Found {expected_count} runs after filtering" in result.output

    def test_should_store_pipeline_run_duration_plot_in_the_given_directory(self, cli):
        path_string = cli.data_stored_at
        FileHandlerForTesting(path_string).store_json_file(
            "workflows.json", github_workflows_data()
        )

        result = cli.runner.invoke(
            main,
            [
                "pipelines",
                "runs-duration",
                "--out-file",
                "run_duration.png",
            ],
        )

        assert f"Saved plot to {path_string}/run_duration.png" in result.output

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
                    "count": 1,
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
                    "count": 1,
                },
            ),
        ],
    )
    def test_should_filter_by_raw_filters(self, cli, workflow_runs, expected):
        expected_count = expected["count"]
        command = expected["command"]
        path_string = cli.data_stored_at
        FileHandlerForTesting(path_string).store_json_file(
            "workflows.json", workflow_runs
        )

        result = cli.runner.invoke(
            main,
            command,
        )

        assert f"Found {expected_count} runs after filtering" in result.output
