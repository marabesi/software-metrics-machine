import pytest
from software_metrics_machine.apps.cli import main
from unittest.mock import patch
from tests.prs_builder import PullRequestBuilder
from tests.prs_comment_builder import PullRequestCommentsBuilder
from tests.response_builder import build_http_successfull_response
from tests.file_handler_for_testing import FileHandlerForTesting


class TestCliPrsCommands:

    @pytest.fixture(scope="class", autouse=True)
    def reset_mock_get(self):
        with patch("requests.get") as mock_get:
            mock_get.reset_mock()
            yield mock_get

    def test_can_run_fetch_prs_command(self, cli):
        with patch("requests.get") as mock_get:
            mock_get.return_value = build_http_successfull_response([])

            result = cli.runner.invoke(main, ["prs", "fetch"])
            assert 0 == result.exit_code

    def test_can_run_fetch_prs_comment_command(self, cli):
        with patch("requests.get") as mock_get:
            mock_get.return_value = build_http_successfull_response([])

            result = cli.runner.invoke(main, ["prs", "fetch-comments"])
            assert 0 == result.exit_code

    def test_show_help_message_for_fetch_prs(self, cli):
        result = cli.runner.invoke(main, ["prs", "fetch", "--help"])
        assert "Show this message and exit" in result.output

    def test_can_run_fetch_with_raw_filters_for_api(self, cli):
        result = cli.runner.invoke(
            main,
            [
                "prs",
                "fetch",
                "--start-date",
                "2023-01-01",
                "--end-date",
                "2023-01-02",
                "--raw-filters",
                "status=all",
                "--help",
            ],
        )
        assert "Filters to apply to the GitHub API request" in result.output

    def test_fetch_prs_between_dates(self, cli):
        configuration = cli.configuration

        with patch("requests.get") as mock_get:
            mock_get.return_value = build_http_successfull_response(
                [
                    PullRequestBuilder()
                    .with_created_at("2011-01-26T19:01:12Z")
                    .with_closed_at("2011-01-26T19:01:12Z")
                    .build()
                ]
            )

            result = cli.runner.invoke(
                main,
                [
                    "prs",
                    "fetch",
                    "--start-date",
                    "2023-01-01",
                    "--end-date",
                    "2023-01-31",
                ],
            )

            assert (
                f"Fetching PRs for {configuration.github_repository} from 2023-01-01 to 2023-01-31"
                in result.output
            )  # noqa
            assert f"Data written to {cli.data_stored_at}" in result.output

    def test_fetch_prs_from_last_month(self, cli):
        with patch("requests.get") as mock_get:
            mock_get.return_value = build_http_successfull_response(
                [
                    PullRequestBuilder()
                    .with_created_at("2011-01-26T19:01:12Z")
                    .with_closed_at("2011-01-26T19:01:12Z")
                    .build()
                ]
            )

            result = cli.runner.invoke(
                main,
                [
                    "prs",
                    "fetch",
                    "--months",
                    "1",
                ],
            )
            mock_get.assert_called_once()
            assert f"Data written to {cli.data_stored_at}" in result.output

    def test_fetch_defaults_to_1_month_when_no_date_is_provided(self, cli):
        with patch("requests.get") as mock_get:
            mock_get.return_value = build_http_successfull_response(
                [
                    PullRequestBuilder()
                    .with_created_at("2011-01-26T19:01:12Z")
                    .with_closed_at("2011-01-26T19:01:12Z")
                    .build()
                ]
            )

            result = cli.runner.invoke(
                main,
                [
                    "prs",
                    "fetch",
                ],
            )

            assert (
                "No start_date or end_date provided. Defaulting to the last 1 month(s)."
                in result.output
            )
            mock_get.assert_called_once()

    def test_with_stored_data_load_prs_to_be_plot_by_author(self, cli):
        path_string = cli.data_stored_at
        pull_requests_data = [
            PullRequestBuilder()
            .with_created_at("2011-01-26T19:01:12Z")
            .with_closed_at("2011-01-26T19:01:12Z")
            .build(),
            PullRequestBuilder()
            .with_created_at("2011-01-26T19:01:12Z")
            .with_closed_at("2011-01-26T19:01:12Z")
            .build(),
        ]
        FileHandlerForTesting(path_string).store_prs_with(pull_requests_data)

        result = cli.runner.invoke(
            main,
            [
                "prs",
                "by-author",
                "--top",
                "5",
                "--labels",
                "bug",
                "--out-file",
                "output.png",
            ],
        )
        assert 0 == result.exit_code
        assert "Loaded 2 PRs" in result.output

    def test_with_stored_data_review_time_by_author(self, cli):
        path_string = cli.data_stored_at
        pull_requests_data = [
            PullRequestBuilder()
            .with_created_at("2011-01-26T19:01:12Z")
            .with_closed_at("2011-01-26T19:01:12Z")
            .build(),
            PullRequestBuilder()
            .with_created_at("2011-01-26T19:01:12Z")
            .with_closed_at("2011-01-26T19:01:12Z")
            .build(),
        ]
        FileHandlerForTesting(path_string).store_prs_with(pull_requests_data)

        result = cli.runner.invoke(
            main,
            [
                "prs",
                "review-time-by-author",
                "--top",
                "5",
                "--labels",
                "enhancement",
                "--out-file",
                "output.png",
            ],
        )
        assert 0 == result.exit_code
        assert "Loaded 2 PRs" in result.output

    @pytest.mark.parametrize(
        "data, expected_output",
        [
            pytest.param(
                {
                    "prs": [
                        PullRequestBuilder()
                        .with_author("alice")
                        .with_created_at("2011-01-26T19:00:12Z")
                        .mark_merged("2011-01-26T19:10:12Z")
                        .build(),
                    ],
                },
                "alice  0.006944",
                id="merged in 10 minutes",
            ),
            pytest.param(
                {
                    "prs": [
                        PullRequestBuilder()
                        .with_author("bob")
                        .with_created_at("2011-01-25T19:00:12Z")
                        .mark_merged("2011-01-26T19:20:12Z")
                        .build(),
                    ],
                },
                "bob  1.0",
                id="merged in 1 day and 20 minutes",
            ),
            pytest.param(
                {
                    "prs": [
                        PullRequestBuilder()
                        .with_author("charlie")
                        .with_created_at("2011-01-01T19:00:12Z")
                        .mark_merged("2011-01-31T19:20:12Z")
                        .build(),
                    ],
                },
                "charlie  30.0",
                id="merged in 30 days and 20 minutes",
            ),
        ],
    )
    def test_with_stored_data_print_review_time_by_day(
        self, cli, data, expected_output
    ):
        path_string = cli.data_stored_at
        FileHandlerForTesting(path_string).store_prs_with(data["prs"])

        result = cli.runner.invoke(
            main,
            [
                "prs",
                "review-time-by-author",
            ],
        )
        assert expected_output in result.output

    @pytest.mark.parametrize(
        "prs",
        [
            [
                PullRequestBuilder()
                .with_created_at("2011-01-26T19:01:12Z")
                .with_closed_at("2011-01-26T19:01:12Z")
                .build(),
                PullRequestBuilder()
                .with_created_at("2011-01-26T19:01:12Z")
                .with_closed_at("2011-01-26T19:01:12Z")
                .build(),
            ],
            [],
        ],
    )
    def test_with_stored_data_summary(self, cli, prs):
        path_string = cli.data_stored_at
        FileHandlerForTesting(path_string).store_prs_with(prs)

        result = cli.runner.invoke(
            main,
            [
                "prs",
                "summary",
                "--csv",
                "data.csv",
                "--start-date",
                "2023-01-01",
                "--end-date",
                "2023-12-31",
                "--output",
                "text",
            ],
        )
        assert 0 == result.exit_code
        assert f"Loaded {len(prs)} PRs" in result.output

    def test_exports_csv_data(self, cli):
        path_string = cli.data_stored_at
        FileHandlerForTesting(path_string).store_prs_with(
            [
                PullRequestBuilder()
                .with_created_at("2011-01-26T19:01:12Z")
                .with_closed_at("2011-01-26T19:01:12Z")
                .build(),
            ]
        )

        result = cli.runner.invoke(
            main,
            [
                "prs",
                "summary",
                "--csv",
                "data.csv",
            ],
        )
        assert "Successfully exported data to data.csv" in result.output

    def test_with_empty_data_summary(self, cli):
        result = cli.runner.invoke(
            main,
            [
                "prs",
                "summary",
            ],
        )

        assert "No PRs to summarize" in result.output
        assert 0 == result.exit_code

    def test_with_stored_data_plot_average_prs_open_by(self, cli):
        path_string = cli.data_stored_at
        pull_requests_data = [
            PullRequestBuilder()
            .with_created_at("2011-01-26T19:01:12Z")
            .with_closed_at("2011-01-26T19:02:12Z")
            .build(),
            PullRequestBuilder()
            .with_created_at("2011-01-26T19:01:12Z")
            .with_closed_at("2011-01-26T19:02:12Z")
            .build(),
        ]
        FileHandlerForTesting(path_string).store_prs_with(pull_requests_data)

        result = cli.runner.invoke(
            main,
            [
                "prs",
                "average-open-by",
                "--out-file",
                "output.png",
                "--author",
                "john",
                "--labels",
                "bug",
                "--aggregate-by",
                "month",
            ],
        )
        assert 0 == result.exit_code
        assert "Loaded 2 PRs" in result.output
        assert "Filtered PRs count: 2" in result.output

    @pytest.mark.parametrize(
        "data, expected_output",
        [
            (
                {
                    "prs": [
                        PullRequestBuilder()
                        .with_created_at("2011-01-25T19:00:12Z")
                        .with_closed_at("2011-01-26T19:20:12Z")
                        .mark_merged("2011-01-26T19:20:12Z")
                        .build(),
                    ],
                    "aggregate_by": "month",
                },
                "2011-01-01  1.0",
            ),
            (
                {
                    "prs": [
                        PullRequestBuilder()
                        .with_created_at("2011-01-25T19:00:12Z")
                        .with_closed_at("2011-01-26T19:20:12Z")
                        .mark_merged("2011-01-26T19:20:12Z")
                        .build(),
                    ],
                    "aggregate_by": "week",
                },
                "2011-01-24  1.0",
            ),
        ],
    )
    def test_with_stored_data_print_average_prs_open_by(
        self, cli, data, expected_output
    ):
        path_string = cli.data_stored_at
        FileHandlerForTesting(path_string).store_prs_with(data["prs"])

        result = cli.runner.invoke(
            main,
            ["prs", "average-open-by", "--aggregate-by", data["aggregate_by"]],
        )
        assert expected_output in result.output

    def test_fetch_prs_comments_between_dates(self, cli):
        path_string = cli.data_stored_at
        pull_requests_data = [
            PullRequestBuilder().with_created_at("2023-01-26T19:01:12Z").build(),
        ]
        FileHandlerForTesting(path_string).store_prs_with(pull_requests_data)

        with patch("requests.get") as mock_get:
            mock_get.return_value = build_http_successfull_response(
                [
                    PullRequestCommentsBuilder()
                    .with_created_at("2023-01-27T19:01:12Z")
                    .build()
                ]
            )

            result = cli.runner.invoke(
                main,
                [
                    "prs",
                    "fetch-comments",
                    "--start-date",
                    "2023-01-01",
                    "--end-date",
                    "2023-01-31",
                ],
            )

            assert (
                "Wrote 1 review comments to prs_review_comments.json" in result.output
            )

    def test_calculates_the_average_of_comments_from_a_single_pr(self, cli):
        path_string = cli.data_stored_at
        pull_requests_data = [
            PullRequestBuilder().with_created_at("2023-01-26T19:01:12Z").build(),
        ]
        FileHandlerForTesting(path_string).store_prs_with(pull_requests_data)

        pull_requests_comments_data = [
            PullRequestCommentsBuilder()
            .with_created_at("2023-01-27T19:01:12Z")
            .build(),
        ]

        FileHandlerForTesting(path_string).store_prs_comment_with(
            pull_requests_comments_data
        )

        result = cli.runner.invoke(
            main,
            [
                "prs",
                "average-comments-by",
            ],
        )

        assert "{'x': [], 'y': [], 'period': []}" in result.output
