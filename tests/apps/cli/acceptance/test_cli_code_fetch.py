from subprocess import CompletedProcess
from unittest.mock import patch

import pytest

from software_metrics_machine.apps.cli import main


class TestCliCodeFetchCommands:

    @pytest.fixture(scope="function", autouse=True)
    def reset_mock_run(self):
        with patch(
            "software_metrics_machine.core.infrastructure.run.Run.run_command"
        ) as mock_run:
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
        with patch(
            "software_metrics_machine.core.infrastructure.run.Run.run_command"
        ) as mock_run:
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
                "src/software_metrics_machine/providers/codemaat/fetch-codemaat.sh",
                configuration.git_repository_location,
                cli.codemaat_stored_at,
                "2025-01-01",
                "",
                "false",
            ] == run_command

    def test_should_fetch_for_a_subfolder_in_repo(self, cli):
        configuration = cli.configuration
        with patch(
            "software_metrics_machine.core.infrastructure.run.Run.run_command"
        ) as mock_run:
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
                "src/software_metrics_machine/providers/codemaat/fetch-codemaat.sh",
                configuration.git_repository_location,
                cli.codemaat_stored_at,
                "2025-01-01",
                "tests/",
                "false",
            ] == run_command

    def test_should_output_error_when_command_fails(self, cli):
        with patch(
            "software_metrics_machine.core.infrastructure.run.Run.run_command"
        ) as mock_run:
            mock_run.return_value = CompletedProcess(
                args="", returncode=1, stdout=None, stderr="ERROR!"
            )

            result = cli.runner.invoke(
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

            assert "Command errored with status 1 error: ERROR!" in result.output
