from unittest.mock import patch

from requests import Response
from src.apps.cli.main import main
from tests.builders import as_json_string


class TestWorkflowsFetchCliCommands:

    def test_can_run_fetch_workflows_command(self, cli):
        result = cli.runner.invoke(main, ["pipelines", "fetch", "--help"])
        assert 0 == result.exit_code
        assert "Show this message and exit" in result.output
        assert "" == result.stderr

    def test_should_fetch_workflow_data_between_dates_date_by_date(self, cli):
        result = cli.runner.invoke(
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

        assert "Step by (e.g., hour, day, month)" in result.output

    def test_should_fetch_workflow_data_between_dates(self, cli):
        configuration = cli.configuration
        result = cli.runner.invoke(
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

    def test_should_fetch_with_raw_filters(self, cli):
        with patch("requests.get") as mock_get:
            fetch_workflows_fake_response = {
                "links": {},
                "total_count": 1,
                "workflow_runs": [
                    {
                        "created_at": "2023-01-01T00:01:12Z",
                    }
                ],
            }

            response = Response()
            response._content = bytes(
                as_json_string(fetch_workflows_fake_response), "utf-8"
            )
            response.status_code = 200
            mock_get.return_value = response

            result = cli.runner.invoke(
                main,
                [
                    "pipelines",
                    "fetch",
                    "--start-date",
                    "2023-01-01",
                    "--end-date",
                    "2023-01-01",
                    "--raw-filters",
                    "event=push",
                ],
            )

            assert 0 == result.exit_code
            assert (
                "fetching https://api.github.com/repos/fake/repo/actions/runs?per_page=100 with params: {'event': 'push', 'created': '2023-01-01..2023-01-01'}"  # noqa
                in result.output
            )

    def test_should_fetch_with_by_hour(self, cli):
        with patch("requests.get") as mock_get:
            fetch_workflows_fake_response = {
                "links": {},
                "total_count": 1,
                "workflow_runs": [
                    {
                        "created_at": "2023-01-01T00:01:12Z",
                    }
                ],
            }

            response = Response()
            response._content = bytes(
                as_json_string(fetch_workflows_fake_response), "utf-8"
            )
            response.status_code = 200
            mock_get.return_value = response

            result = cli.runner.invoke(
                main,
                [
                    "pipelines",
                    "fetch",
                    "--start-date",
                    "2023-01-01",
                    "--end-date",
                    "2023-01-01",
                    "--step-by",
                    "hour",
                ],
            )

            assert 0 == result.exit_code
            assert (
                "fetching https://api.github.com/repos/fake/repo/actions/runs?per_page=100 with params: {'created': '2023-01-01T00:00:00..2023-01-01T01:00:00'}"  # noqa
                in result.output
            )
