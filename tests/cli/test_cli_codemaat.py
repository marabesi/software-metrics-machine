import os
from apps.cli.main import main

from infrastructure.configuration.configuration_file_system_handler import (
    ConfigurationFileSystemHandler,
)
from tests.in_memory_configuration import InMemoryConfiguration


class TestCliCommands:

    def test_can_run_code_churn_without_data_available(self, cli, tmp_path):
        path_string = str(tmp_path)
        os.environ["SMM_STORE_DATA_AT"] = path_string
        ConfigurationFileSystemHandler(path_string).store_file(
            "smm_config.json", InMemoryConfiguration(path_string)
        )

        result = cli.invoke(
            main,
            ["codemaat", "code-churn", "--out-file", "code_churn.png"],
        )
        assert "No code churn data available to plot" in result.output
