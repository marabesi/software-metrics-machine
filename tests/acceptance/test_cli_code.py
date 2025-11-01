from subprocess import CompletedProcess
from unittest.mock import patch

import pytest

from apps.cli.main import main

from tests.file_handler_for_testing import FileHandlerForTesting


class TestCliCodeCommands:

    @pytest.fixture(scope="function", autouse=True)
    def reset_mock_run(self):
        with patch("core.infrastructure.run.Run.run_command") as mock_run:
            mock_run.reset_mock()
            yield mock_run

    def test_has_fetch_command(self, cli):
        result = cli.runner.invoke(
            main,
            ["code", "fetch", "--help"],
        )
        assert "Fetch historical data from a git repository" in result.output
        assert result.stderr == ""

    def test_runs_fetch_for_a_repo(self, cli):
        configuration = cli.configuration
        with patch("core.infrastructure.run.Run.run_command") as mock_run:
            mock_run.return_value = CompletedProcess(
                args="", returncode=0, stdout="total 0 .\nexample\n", stderr=""
            )

            cli.runner.invoke(
                main,
                [
                    "code",
                    "fetch",
                    "--start-date",
                    "2025-01-01",
                    "--end-date",
                    "2025-01-01",
                ],
            )
            run_command = mock_run.call_args[0][0]
            assert [
                "sh",
                "providers/codemaat/fetch-codemaat.sh",
                configuration.git_repository_location,
                configuration.store_data,
                "2025-01-01",
                "",
                "false",
            ] == run_command

    def test_should_fetch_for_a_subfolder_in_repo(self, cli):
        configuration = cli.configuration
        with patch("core.infrastructure.run.Run.run_command") as mock_run:
            mock_run.return_value = CompletedProcess(
                args="", returncode=0, stdout="total 0 .\nexample\n", stderr=""
            )

            cli.runner.invoke(
                main,
                [
                    "code",
                    "fetch",
                    "--start-date",
                    "2025-01-01",
                    "--end-date",
                    "2025-01-01",
                    "--subfolder",
                    "tests/",
                ],
            )
            run_command = mock_run.call_args[0][0]
            assert [
                "sh",
                "providers/codemaat/fetch-codemaat.sh",
                configuration.git_repository_location,
                configuration.store_data,
                "2025-01-01",
                "tests/",
                "false",
            ] == run_command

    def test_can_run_code_churn_without_data_available(self, cli):
        result = cli.runner.invoke(
            main,
            [
                "code",
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

    @pytest.mark.skip(
        reason="Needs refactoring to return PlotResult from render methods"
    )
    def test_given_the_data_it_renders_code_churn(self, cli):
        path_string = cli.data_stored_at
        csv_data = """date,added,deleted,commits
2022-06-17,10,10,2"""
        FileHandlerForTesting(path_string).store_file("abs-churn.csv", csv_data)

        result = cli.runner.invoke(
            main,
            ["code", "code-churn", "--out-file", "code_churn.png"],
        )
        assert f"Saved plot to {path_string}/code_churn.png" in result.output

    def test_renders_code_churn_by_date(self, cli):
        path_string = cli.data_stored_at

        csv_data = """date,added,deleted,commits
2022-06-17,10,10,2"""
        FileHandlerForTesting(path_string).store_file("abs-churn.csv", csv_data)

        result = cli.runner.invoke(
            main,
            [
                "code",
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

    def test_can_run_entity_churn_without_data_available(self, cli):
        result = cli.runner.invoke(
            main,
            ["code", "entity-churn", "--out-file", "entity_churn.png"],
        )
        assert "No entity churn data available to plot" in result.output

    def test_can_run_entity_effort_without_data_available(self, cli):
        result = cli.runner.invoke(
            main,
            ["code", "entity-effort", "--out-file", "entity_effort.png"],
        )
        assert "No entity effort data available to plot" in result.output

    def test_can_run_entity_ownership_without_data_available(self, cli):
        result = cli.runner.invoke(
            main,
            ["code", "entity-ownership", "--out-file", "entity_ownership.png"],
        )
        assert "No entity ownership data available to plot" in result.output

    def test_list_the_number_of_revision_found_for_entity_ownership(self, cli):
        path_string = cli.data_stored_at
        csv_data = """entity,author,added,deleted
file.txt,John,10,2"""
        FileHandlerForTesting(path_string).store_file("entity-ownership.csv", csv_data)

        result = cli.runner.invoke(
            main,
            ["code", "entity-ownership", "--out-file", "entity_ownership.png"],
        )

        assert "Found 1 row for entity ownership" in result.output

    def test_filter_entity_ownership_by_author(self, cli):
        path_string = cli.data_stored_at
        csv_data = """entity,author,added,deleted
file.txt,John,10,2"""
        FileHandlerForTesting(path_string).store_file("entity-ownership.csv", csv_data)

        result = cli.runner.invoke(
            main,
            [
                "code",
                "entity-ownership",
                "--out-file",
                "entity_ownership.png",
                "--authors",
                "Jane",
            ],
        )

        assert "Found 0 row for entity ownership" in result.output
