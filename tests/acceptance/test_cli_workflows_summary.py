import pytest
from apps.cli.main import main

from tests.file_handler_for_testing import FileHandlerForTesting


class TestWorkflowsSummaryCliCommands:

    def test_summary_workflows_is_defined(self, cli):
        result = cli.runner.invoke(
            main,
            [
                "pipelines",
                "summary",
            ],
        )
        assert 0 == result.exit_code

    @pytest.mark.parametrize(
        "workflows",
        [
            [
                {
                    "id": 1,
                    "path": "/workflows/build.yml",
                    "conclusion": "success",
                    "created_at": "2023-10-01T12:00:00Z",
                },
            ],
        ],
    )
    def test_summary_workflows(self, cli, workflows):
        path_string = cli.data_stored_at

        FileHandlerForTesting(path_string).store_json_file("workflows.json", workflows)

        result = cli.runner.invoke(
            main,
            [
                "pipelines",
                "summary",
            ],
        )
        assert "Total runs: 1" in result.output
        assert "Most failed run: N/A" in result.output
        assert "1  <unnamed>  (/workflows/build.yml)" in result.output
