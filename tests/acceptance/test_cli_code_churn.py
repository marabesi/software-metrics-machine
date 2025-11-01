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
