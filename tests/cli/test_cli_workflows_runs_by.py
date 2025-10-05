import os

import pytest
from apps.cli.main import main

from infrastructure.configuration.configuration_file_system_handler import (
    ConfigurationFileSystemHandler,
)
from tests.file_handler_for_testing import FileHandlerForTesting
from tests.in_memory_configuration import InMemoryConfiguration


class TestWorkflowsRunsByCliCommands:

    def test_can_run_view_workflow_by(self, cli):
        result = cli.invoke(main, ["pipelines", "workflow-runs-by", "--help"])
        assert 0 == result.exit_code
        assert "Comma-separated key=value pairs to filter runs" in result.output

    @pytest.mark.parametrize(
        "workflow_runs, expected",
        [
            (
                [
                    {
                        "id": 1,
                        "path": "/workflows/build.yml",
                        "status": "success",
                        "created_at": "2023-10-01T12:00:00Z",
                        "head_branch": "main",
                    },
                    {
                        "id": 2,
                        "path": "/workflows/build.yml",
                        "status": "success",
                        "created_at": "2023-10-01T12:00:00Z",
                        "head_branch": "master",
                    },
                ],
                {"target": "main", "count": 1},
            ),
            ([], {"target": "main", "count": 0}),
            (
                [
                    {
                        "id": 1,
                        "path": "/workflows/build.yml",
                        "status": "success",
                        "created_at": "2023-10-01T12:00:00Z",
                        "head_branch": "main",
                    },
                    {
                        "id": 2,
                        "path": "/workflows/build.yml",
                        "status": "success",
                        "created_at": "2023-10-01T12:00:00Z",
                        "head_branch": "master",
                    },
                ],
                {"target": "main,master", "count": 1},  # ignores second after comma
            ),
        ],
    )
    def test_should_filter_workflows_by_target_branch(
        self, cli, tmp_path, workflow_runs, expected
    ):
        target = expected["target"]
        expected_count = expected["count"]

        path_string = str(tmp_path)
        os.environ["SMM_STORE_DATA_AT"] = path_string
        configuration = InMemoryConfiguration(path_string)
        ConfigurationFileSystemHandler(path_string).store_file(
            "smm_config.json", configuration
        )
        FileHandlerForTesting(path_string).store_json_file(
            "workflows.json", workflow_runs
        )

        result = cli.invoke(
            main,
            [
                "pipelines",
                "workflow-runs-by",
                "--start-date",
                "2023-10-01",
                "--end-date",
                "2023-10-01",
                "--raw-filters",
                f"target_branch={target}",
            ],
        )

        assert f"Found {expected_count} runs after filtering" in result.output
