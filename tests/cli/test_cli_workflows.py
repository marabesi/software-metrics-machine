import os
from apps.cli.main import main

from infrastructure.configuration_file_system_handler import (
    ConfigurationFileSystemHandler,
)
from tests.file_handler_for_testing import FileHandlerForTesting
from tests.in_memory_configuration import InMemoryConfiguration


class TestWorkflowsCliCommands:

    def test_can_run_fetch_workflows_command(self, cli):
        result = cli.invoke(main, ["workflows", "--help"])
        assert result.exit_code == 0
        assert "Show this message and exit" in result.output

    def test_deployment_frequency_by_author(self, cli, tmp_path):
        path_string = str(tmp_path)
        os.environ["SMM_STORE_DATA_AT"] = path_string
        ConfigurationFileSystemHandler(path_string).store_file(
            "smm_config.json", InMemoryConfiguration(path_string)
        )

        deployment_frequency = [
            {
                "id": 1,
                "path": "/workflows/build.yml",
                "status": "success",
                "created_at": "2023-10-01T12:00:00Z",
                "jobs": [
                    {
                        "name": "Deploy",
                        "conclusion": "success",
                        "created_at": "2023-10-01T12:05:00Z",
                    }
                ],
            },
        ]
        FileHandlerForTesting(path_string).store_file(
            "workflows.json", deployment_frequency
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
        assert result.exit_code == 0
        assert "Loaded 1 runs" in result.output
