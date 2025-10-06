import pytest
from apps.cli.main import main

from tests.file_handler_for_testing import FileHandlerForTesting


class TestWorkflowsSummaryCliCommands:

    @pytest.mark.parametrize(
        "workflows",
        [
            [
                {
                    "id": 1,
                    "path": "/workflows/build.yml",
                    "status": "success",
                    "created_at": "2023-10-01T12:00:00Z",
                },
            ],
            [],
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
        assert 0 == result.exit_code
