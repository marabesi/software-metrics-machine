from unittest.mock import patch

import pytest

from software_metrics_machine.apps.cli import main
from tests.csv_builder import CSVBuilder


class TestCliCodeEntityChurnCommands:

    @pytest.fixture(scope="function", autouse=True)
    def reset_mock_run(self):
        with patch(
            "software_metrics_machine.core.infrastructure.run.Run.run_command"
        ) as mock_run:
            mock_run.reset_mock()
            yield mock_run

    def test_defines_include_only_argument(self, cli):
        cli.storage.store_csv_file("entity_churn.csv", "")
        result = cli.runner.invoke(
            main,
            ["code", "entity-churn", "--help"],
        )
        assert "--include-only" in result.output

    def test_can_run_entity_churn_without_data_available(self, cli):
        result = cli.runner.invoke(
            main,
            ["code", "entity-churn"],
        )
        assert "No entity churn data available to plot" in result.output

    def test_includes_only_specified_paths_for_analysis(self, cli):
        csv_data = (
            CSVBuilder(headers=["entity", "added", "deleted", "commits"])
            .extend_rows(
                [
                    ["src/another.txt", 10, 2, 1],
                    ["application/file.ts", 10, 2, 1],
                ]
            )
            .build()
        )
        cli.storage.store_csv_file("entity-churn.csv", csv_data)
        result = cli.runner.invoke(
            main,
            ["code", "entity-churn", "--include-only", "src/**"],
        )
        assert (
            "Applied include only file patterns: ['src/**'], remaining rows: 1"
            in result.output
        )

    def test_print_code_churn_data(self, cli):
        csv_data = (
            CSVBuilder(headers=["entity", "added", "deleted", "commits"])
            .extend_rows(
                [
                    ["src/another.txt", 10, 2, 1],
                    ["application/file.ts", 10, 2, 1],
                ]
            )
            .build()
        )
        cli.storage.store_csv_file("entity-churn.csv", csv_data)
        result = cli.runner.invoke(
            main,
            ["code", "entity-churn", "--include-only", "src/**"],
        )
        # entity  added  deleted  commits     short_entity  total_churn
        assert (
            "src/another.txt     10        2        1  src/another.txt           12"
            in result.output
        )
