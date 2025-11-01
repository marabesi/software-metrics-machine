from unittest.mock import patch

import pytest

from apps.cli.main import main

from tests.file_handler_for_testing import FileHandlerForTesting


class TestCliCodeCouplingCommands:

    @pytest.fixture(scope="function", autouse=True)
    def reset_mock_run(self):
        with patch("core.infrastructure.run.Run.run_command") as mock_run:
            mock_run.reset_mock()
            yield mock_run

    def test_can_run_coupling_without_data_available(self, cli):
        result = cli.runner.invoke(
            main,
            ["code", "coupling", "--out-file", "coupling.png"],
        )
        assert "No coupling data available to plot" in result.output

    def test_can_run_coupling_with_ignored_files(self, cli):
        path_string = cli.data_stored_at

        csv_data = """entity,coupled,degree,average-revs
another.txt,aaaa.mp3,10,2
file.ts,brum.ts,10,2
"""
        FileHandlerForTesting(path_string).store_file("coupling.csv", csv_data)
        result = cli.runner.invoke(
            main,
            ["code", "coupling", "--ignore-files", "*.txt"],
        )
        assert "Filtered coupling data count: 1" in result.output
