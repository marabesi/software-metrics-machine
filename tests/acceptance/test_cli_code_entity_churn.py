from unittest.mock import patch

import pytest

from software_metrics_machine.apps.cli import main
from tests.csv_builder import CSVBuilder
from tests.file_handler_for_testing import FileHandlerForTesting


class TestCliCodeEntityChurnCommands:

    @pytest.fixture(scope="function", autouse=True)
    def reset_mock_run(self):
        with patch(
            "software_metrics_machine.core.infrastructure.run.Run.run_command"
        ) as mock_run:
            mock_run.reset_mock()
            yield mock_run

    def test_defines_include_only_argument(self, cli):
        path_string = cli.data_stored_at

        FileHandlerForTesting(path_string).store_file("entity_churn.csv", "")
        result = cli.runner.invoke(
            main,
            ["code", "entity-churn", "--help"],
        )
        assert "--include-only" in result.output

    def test_can_run_entity_churn_without_data_available(self, cli):
        result = cli.runner.invoke(
            main,
            ["code", "entity-churn", "--out-file", "entity_churn.png"],
        )
        assert "No entity churn data available to plot" in result.output

    def test_includes_only_specified_paths_for_analysis(self, cli):
        path_string = cli.data_stored_at

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
        FileHandlerForTesting(path_string).store_file("entity-churn.csv", csv_data)
        result = cli.runner.invoke(
            main,
            ["code", "entity-churn", "--include-only", "src/**"],
        )
        assert (
            "Applied include only file patterns: ['src/**'], remaining rows: 1"
            in result.output
        )
