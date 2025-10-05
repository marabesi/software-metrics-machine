import os

import pytest
from apps.cli.main import main

from infrastructure.configuration.configuration_file_system_handler import (
    ConfigurationFileSystemHandler,
)
from tests.file_handler_for_testing import FileHandlerForTesting
from tests.in_memory_configuration import InMemoryConfiguration


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
    def test_summary_workflows(self, cli, tmp_path, workflows):
        path_string = str(tmp_path)
        os.environ["SMM_STORE_DATA_AT"] = path_string
        ConfigurationFileSystemHandler(path_string).store_file(
            "smm_config.json", InMemoryConfiguration(path_string)
        )

        FileHandlerForTesting(path_string).store_json_file("workflows.json", workflows)

        result = cli.invoke(
            main,
            [
                "pipelines",
                "summary",
            ],
        )
        assert 0 == result.exit_code
