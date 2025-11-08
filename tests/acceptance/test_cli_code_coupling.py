from unittest.mock import patch

import pytest

from software_metrics_machine.apps.cli import main

from tests.csv_builder import CSVBuilder
from tests.file_handler_for_testing import FileHandlerForTesting


class TestCliCodeCouplingCommands:

    @pytest.fixture(scope="function", autouse=True)
    def reset_mock_run(self):
        with patch(
            "software_metrics_machine.core.infrastructure.run.Run.run_command"
        ) as mock_run:
            mock_run.reset_mock()
            yield mock_run

    def test_defines_include_only_argument(self, cli):
        path_string = cli.data_stored_at

        FileHandlerForTesting(path_string).store_file("coupling.csv", "")
        result = cli.runner.invoke(
            main,
            ["code", "coupling", "--help"],
        )
        assert "--include-only" in result.output

    def test_can_run_coupling_without_data_available(self, cli):
        result = cli.runner.invoke(
            main,
            ["code", "coupling", "--out-file", "coupling.png"],
        )
        assert "No coupling data available to plot" in result.output

    def test_can_run_coupling_with_ignored_files(self, cli):
        path_string = cli.data_stored_at

        csv_data = (
            CSVBuilder(headers=["entity", "coupled", "degree", "average-revs"])
            .extend_rows(
                [
                    ["another.txt", "aaaa.mp3", 10, 2],
                    ["file.ts", "brum.ts", 10, 2],
                ]
            )
            .build()
        )

        FileHandlerForTesting(path_string).store_file("coupling.csv", csv_data)
        result = cli.runner.invoke(
            main,
            ["code", "coupling", "--ignore-files", "*.txt"],
        )
        assert "Filtered coupling data count: 1" in result.output

    def test_includes_only_specified_paths_for_analysis(self, cli):
        path_string = cli.data_stored_at

        csv_data = (
            CSVBuilder(headers=["entity", "coupled", "degree", "average-revs"])
            .extend_rows(
                [
                    ["src/another.txt", "aaaa.mp3", 10, 2],
                    ["application/file.ts", "brum.ts", 10, 2],
                ]
            )
            .build()
        )
        FileHandlerForTesting(path_string).store_file("coupling.csv", csv_data)
        result = cli.runner.invoke(
            main,
            ["code", "coupling", "--include-only", "src/**"],
        )
        assert (
            "Applied include only file patterns: ['src/**'], remaining rows: 1"
            in result.output
        )
