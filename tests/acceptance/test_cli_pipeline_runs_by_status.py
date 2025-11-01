import pytest
from apps.cli.main import main

from tests.builders import github_workflows_data
from tests.file_handler_for_testing import FileHandlerForTesting


class TestPipelineRunsByStatusCliCommands:

    def test_can_run_pipeline_by_status(self, cli):
        result = cli.runner.invoke(main, ["pipelines", "pipeline-by-status", "--help"])
        assert 0 == result.exit_code
        assert "Show this message and exit" in result.output

    def test_should_filter_by_workflow_path(self, cli):
        workflow_runs = github_workflows_data()
        path_string = cli.data_stored_at

        FileHandlerForTesting(path_string).store_json_file(
            "workflows.json", workflow_runs
        )

        result = cli.runner.invoke(
            main,
            [
                "pipelines",
                "pipeline-by-status",
                "--workflow-path",
                "/workflows/tests.yml",
            ],
        )

        assert "Total workflow runs after filters: 1" in result.output

    @pytest.mark.parametrize(
        "command, expected",
        [
            (
                [
                    "pipelines",
                    "pipeline-by-status",
                    "--start-date",
                    "2023-10-01",
                    "--end-date",
                    "2023-12-01",
                ],
                {
                    "count": 2,
                },
            ),
        ],
    )
    def test_should_filter_by_multiple_parameters(self, cli, command, expected):
        expected_count = expected["count"]
        workflow_runs = github_workflows_data()
        path_string = cli.data_stored_at

        FileHandlerForTesting(path_string).store_json_file(
            "workflows.json", workflow_runs
        )

        result = cli.runner.invoke(main, command)

        assert f"Total workflow runs after filters: {expected_count}" in result.output
