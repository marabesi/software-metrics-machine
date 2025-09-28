import os

from apps.cli.main import main

from infrastructure.configuration.configuration_file_system_handler import (
    ConfigurationFileSystemHandler,
)
from tests.file_handler_for_testing import FileHandlerForTesting
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
            [
                "codemaat",
                "code-churn",
                "--out-file",
                "code_churn.png",
                "--start-date",
                "2025-01-01",
                "--end-date",
                "2025-01-01",
            ],
        )
        assert "No code churn data available to plot" in result.output
        assert result.stderr == ""

    def test_given_the_data_it_renders_code_churn(self, cli, tmp_path):
        path_string = str(tmp_path)
        os.environ["SMM_STORE_DATA_AT"] = path_string
        ConfigurationFileSystemHandler(path_string).store_file(
            "smm_config.json", InMemoryConfiguration(path_string)
        )
        csv_data = """date,added,deleted,commits
2022-06-17,10,10,2"""
        FileHandlerForTesting(path_string).store_file("abs-churn.csv", csv_data)

        result = cli.invoke(
            main,
            ["codemaat", "code-churn", "--out-file", "code_churn.png"],
        )
        assert f"Saved plot to {path_string}/code_churn.png" in result.output

    def test_renders_code_churn_by_date(self, cli, tmp_path):
        path_string = str(tmp_path)
        os.environ["SMM_STORE_DATA_AT"] = path_string
        ConfigurationFileSystemHandler(path_string).store_file(
            "smm_config.json", InMemoryConfiguration(path_string)
        )

        csv_data = """date,added,deleted,commits
2022-06-17,10,10,2"""
        FileHandlerForTesting(path_string).store_file("abs-churn.csv", csv_data)

        result = cli.invoke(
            main,
            [
                "codemaat",
                "code-churn",
                "--start-date",
                "2025-01-01",
                "--end-date",
                "2025-01-01",
                "--out-file",
                "code_churn.png",
            ],
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
