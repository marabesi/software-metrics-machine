import os
from apps.cli.main import main
from infrastructure.configuration.configuration_file_system_handler import (
    ConfigurationFileSystemHandler,
)
from tests.in_memory_configuration import InMemoryConfiguration


class TestWorkflowsFetchCliCommands:

    def test_can_run_fetch_workflows_command(self, cli):
        result = cli.invoke(main, ["pipelines", "fetch", "--help"])
        assert 0 == result.exit_code
        assert "Show this message and exit" in result.output
        assert "" == result.stderr

    def test_should_fetch_workflow_data_between_dates_date_by_date(self, cli, tmp_path):
        path_string = str(tmp_path)
        os.environ["SMM_STORE_DATA_AT"] = path_string
        configuration = InMemoryConfiguration(path_string)
        ConfigurationFileSystemHandler(path_string).store_file(
            "smm_config.json", configuration
        )

        result = cli.invoke(
            main,
            [
                "pipelines",
                "fetch",
                "--start-date",
                "2023-01-01",
                "--end-date",
                "2023-01-02",
                "--step-by",
                "day",
                "--help",
            ],
        )

        assert "Step by (e.g., day, month)" in result.output

    def test_should_fetch_workflow_data_between_dates(self, cli, tmp_path):
        path_string = str(tmp_path)
        os.environ["SMM_STORE_DATA_AT"] = path_string
        configuration = InMemoryConfiguration(path_string)
        ConfigurationFileSystemHandler(path_string).store_file(
            "smm_config.json", configuration
        )

        result = cli.invoke(
            main,
            [
                "pipelines",
                "fetch",
                "--start-date",
                "2023-01-01",
                "--end-date",
                "2023-01-31",
            ],
        )

        assert (
            f"Fetching workflow runs for {configuration.github_repository} 2023-01-01 to 2023-01-31 (it will return 1000 runs at max)"  # noqa
            in result.output
        )
        assert (
            "fetching https://api.github.com/repos/fake/repo/actions/runs?per_page=100 with params: {'created': '2023-01-01..2023-01-31'}"  # noqa
            in result.output
        )
