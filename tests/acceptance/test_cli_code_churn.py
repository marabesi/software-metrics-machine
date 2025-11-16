from unittest.mock import patch

import pytest

from software_metrics_machine.apps.cli import main


class TestCliCodeCommands:

    @pytest.fixture(scope="function", autouse=True)
    def reset_mock_run(self):
        with patch(
            "software_metrics_machine.core.infrastructure.run.Run.run_command"
        ) as mock_run:
            mock_run.reset_mock()
            yield mock_run

    def test_can_run_code_churn(self, cli):
        result = cli.runner.invoke(
            main,
            [
                "code",
                "code-churn",
            ],
        )
        assert result.stderr == ""

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

    @pytest.mark.parametrize(
        "csv_data, expected",
        [
            (
                """date,added,deleted,commits
2022-06-17,10,10,2""",
                "2022-06-17    Added     10",
            ),
            (
                """date,added,deleted,commits
2022-06-17,10,10,2""",
                "2022-06-17  Deleted     10",
            ),
        ],
    )
    def test_given_the_data_it_renders_code_churn(self, cli, csv_data, expected):

        cli.storage.store_file("abs-churn.csv", csv_data)

        result = cli.runner.invoke(
            main,
            ["code", "code-churn", "--out-file", "code_churn.png"],
        )
        assert expected in result.output

    def test_renders_code_churn_by_date(self, cli):

        csv_data = """date,added,deleted,commits
2022-06-17,10,10,2"""
        cli.storage.store_file("abs-churn.csv", csv_data)

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
