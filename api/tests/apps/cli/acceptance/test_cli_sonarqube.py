import pytest
from unittest.mock import patch
from software_metrics_machine.apps.cli import main
from tests.response_builder import build_http_successfull_response


class TestCliSonarqubeCommands:
    def test_has_fetch_command(self, cli):
        result = cli.runner.invoke(main, ["sonarqube", "fetch", "--help"])
        assert "Fetch measures from SonarQube" in result.output

    def test_runs_fetch_measures_without_arguments(self, cli):
        with patch("requests.get") as mock_get:
            mock_get.return_value = build_http_successfull_response({"component": {}})

            result = cli.runner.invoke(main, ["sonarqube", "fetch"])
            assert result.exit_code == 0
            assert mock_get.called or "Fetch SonarQube measures completed successfully" in result.output

    def test_runs_fetch_measures_with_options(self, cli):
        with patch("requests.get") as mock_get:
            mock_get.return_value = build_http_successfull_response({"component": {}})

            result = cli.runner.invoke(
                main,
                ["sonarqube", "fetch", "--metric-keys", "bugs,coverage", "--project-key", "P", "--force"],
            )

            assert result.exit_code == 0
            assert mock_get.called
