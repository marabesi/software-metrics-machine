import os
from apps.cli.main import main

from infrastructure.configuration.configuration_file_system_handler import (
    ConfigurationFileSystemHandler,
)
from tests.file_handler_for_testing import FileHandlerForTesting
from tests.in_memory_configuration import InMemoryConfiguration


class TestWorkflowsCliCommands:

    def test_can_run_fetch_workflows_command(self, cli):
        result = cli.invoke(main, ["workflows", "--help"])
        assert 0 == result.exit_code
        assert "Show this message and exit" in result.output

    def test_deployment_frequency_by_author(self, cli, tmp_path):
        path_string = str(tmp_path)
        os.environ["SMM_STORE_DATA_AT"] = path_string
        ConfigurationFileSystemHandler(path_string).store_file(
            "smm_config.json", InMemoryConfiguration(path_string)
        )

        single_deployment_frequency = [
            {
                "id": 1,
                "path": "/workflows/build.yml",
                "status": "success",
                "created_at": "2023-10-01T12:00:00Z",
            },
        ]
        FileHandlerForTesting(path_string).store_file(
            "workflows.json", single_deployment_frequency
        )

        FileHandlerForTesting(path_string).store_file(
            "jobs.json",
            [
                {
                    "id": 105,
                    "run_id": 1,
                    "name": "Deploy",
                    "conclusion": "success",
                    "started_at": "2023-10-01T09:05:00Z",
                    "completed_at": "2023-10-01T09:10:00Z",
                },
            ],
        )

        result = cli.invoke(
            main,
            [
                "workflows",
                "deployment-frequency",
                "--job-name",
                "Deploy",
                "--out-file",
                "deployment_frequency_out.png",
            ],
        )
        assert 0 == result.exit_code
        assert "Loaded 1 runs" in result.output
