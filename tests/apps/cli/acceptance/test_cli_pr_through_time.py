import pytest
from software_metrics_machine.apps.cli import main
from unittest.mock import patch
from tests.prs_builder import PullRequestBuilder


class TestCliPrThroughTimeCommands:

    @pytest.fixture(scope="class", autouse=True)
    def reset_mock_get(self):
        with patch("requests.get") as mock_get:
            mock_get.reset_mock()
            yield mock_get

    @pytest.mark.parametrize(
        "command, expected_in_output",
        [
            (
                [
                    "prs",
                    "through-time",
                ],
                "11-01-26  Opened      1",
            ),
            (
                [
                    "prs",
                    "through-time",
                ],
                "2011-01-26  Closed      1",
            ),
            (
                [
                    "prs",
                    "through-time",
                    "--start-date",
                    "2011-01-25",
                    "--end-date",
                    "2011-01-25",
                ],
                "No data available for the given period.",
            ),
            (
                [
                    "prs",
                    "through-time",
                    "--raw-filters",
                    "state=closed",
                ],
                "No data available for the given period.",
            ),
        ],
    )
    def test_show_all_prs_available(self, cli, command, expected_in_output):
        pull_requests_data = [
            PullRequestBuilder()
            .with_created_at("2011-01-26T19:01:12Z")
            .with_closed_at("2011-01-26T19:01:12Z")
            .with_author("ana")
            .with_state("opened")
            .build(),
        ]
        cli.storage.store_prs_with(pull_requests_data)

        result = cli.runner.invoke(main, command)

        assert expected_in_output in result.output
