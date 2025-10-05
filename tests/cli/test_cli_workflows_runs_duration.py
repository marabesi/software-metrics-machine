import os

import pytest
from apps.cli.main import main

from infrastructure.configuration.configuration_file_system_handler import (
    ConfigurationFileSystemHandler,
)
from tests.builders import workflows_data
from tests.file_handler_for_testing import FileHandlerForTesting
from tests.in_memory_configuration import InMemoryConfiguration


class TestWorkflowsRunsDurationCliCommands:

    @pytest.mark.parametrize(
        "workflow_runs, expected",
        [
            (
                workflows_data(),
                {
                    "command": [
                        "pipelines",
                        "workflows-run-duration",
                        "--start-date",
                        "2023-10-01",
                        "--end-date",
                        "2023-10-01",
                    ],
                    "count": 1,
                },
            ),
            (
                workflows_data(),
                {
                    "command": [
                        "pipelines",
                        "workflows-run-duration",
                        "--workflow-path",
                        "/workflows/tests.yml",
                    ],
                    "count": 1,
                },
            ),
        ],
    )
    def test_should_run_duration_for_a_workflow(
        self, cli, tmp_path, workflow_runs, expected
    ):
        expected_count = expected["count"]
        command = expected["command"]

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
            command,
        )

        assert f"Found {expected_count} runs after filtering" in result.output

    def test_should_store_plot_in_the_given_directory(self, cli, tmp_path):
        path_string = str(tmp_path)
        os.environ["SMM_STORE_DATA_AT"] = path_string
        configuration = InMemoryConfiguration(path_string)
        ConfigurationFileSystemHandler(path_string).store_file(
            "smm_config.json", configuration
        )
        FileHandlerForTesting(path_string).store_json_file(
            "workflows.json", workflows_data()
        )

        result = cli.invoke(
            main,
            [
                "pipelines",
                "workflows-run-duration",
                "--out-file",
                "run_duration.png",
            ],
        )

        assert f"Saved plot to {path_string}/run_duration.png" in result.output
