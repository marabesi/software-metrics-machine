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

    def test_can_run_coupling_without_data_available(self, cli, tmp_path):
        path_string = str(tmp_path)
        os.environ["SMM_STORE_DATA_AT"] = path_string
        ConfigurationFileSystemHandler(path_string).store_file(
            "smm_config.json", InMemoryConfiguration(path_string)
        )

        result = cli.invoke(
            main,
            ["codemaat", "coupling", "--out-file", "coupling.png"],
        )
        assert "No coupling data available to plot" in result.output

    def test_can_run_entity_churn_without_data_available(self, cli, tmp_path):
        path_string = str(tmp_path)
        os.environ["SMM_STORE_DATA_AT"] = path_string
        ConfigurationFileSystemHandler(path_string).store_file(
            "smm_config.json", InMemoryConfiguration(path_string)
        )

        result = cli.invoke(
            main,
            ["codemaat", "entity-churn", "--out-file", "entity_churn.png"],
        )
        assert "No entity churn data available to plot" in result.output

    def test_can_run_entity_effort_without_data_available(self, cli, tmp_path):
        path_string = str(tmp_path)
        os.environ["SMM_STORE_DATA_AT"] = path_string
        ConfigurationFileSystemHandler(path_string).store_file(
            "smm_config.json", InMemoryConfiguration(path_string)
        )

        result = cli.invoke(
            main,
            ["codemaat", "entity-effort", "--out-file", "entity_effort.png"],
        )
        assert "No entity effort data available to plot" in result.output

    def test_can_run_entity_ownership_without_data_available(self, cli, tmp_path):
        path_string = str(tmp_path)
        os.environ["SMM_STORE_DATA_AT"] = path_string
        ConfigurationFileSystemHandler(path_string).store_file(
            "smm_config.json", InMemoryConfiguration(path_string)
        )

        result = cli.invoke(
            main,
            ["codemaat", "entity-ownership", "--out-file", "entity_ownership.png"],
        )
        assert "No entity ownership data available to plot" in result.output
