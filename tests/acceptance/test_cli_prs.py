import pytest
from software_metrics_machine.apps.cli import main
from unittest.mock import patch
from tests.prs_builder import PullRequestBuilder
from tests.prs_comment_builder import PullRequestCommentsBuilder
from tests.response_builder import build_http_successfull_response


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

    def test_no_prs_with_given_label(self, cli):
        pull_requests_data = [
            PullRequestBuilder()
            .with_created_at("2011-01-26T19:01:12Z")
            .with_closed_at("2011-01-26T19:01:12Z")
            .with_author("ana")
            .build(),
            PullRequestBuilder()
            .with_created_at("2011-01-26T19:01:12Z")
            .with_closed_at("2011-01-26T19:01:12Z")
            .with_author("ana")
            .build(),
        ]
        cli.storage.store_prs_with(pull_requests_data)

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
        assert "No PRs to plot after filtering" in result.output

    def test_print_prs_created_by_authors(self, cli):

        pull_requests_data = [
            PullRequestBuilder()
            .with_author("ana")
            .with_created_at("2011-01-26T19:01:12Z")
            .with_closed_at("2011-01-26T19:01:12Z")
            .build(),
        ]
        cli.storage.store_prs_with(pull_requests_data)

        result = cli.runner.invoke(
            main,
            [
                "prs",
                "by-author",
            ],
        )
        assert "ana      1" in result.output

    def test_with_stored_data_review_time_by_author(self, cli):
        # does not take into account closed prs, only prs that were merged
        pull_requests_data = [
            PullRequestBuilder()
            .with_created_at("2011-01-26T19:01:12Z")
            .mark_merged("2011-01-26T19:01:12Z")
            .with_author("ana")
            .build(),
            PullRequestBuilder()
            .with_created_at("2011-01-26T19:01:12Z")
            .with_closed_at("2011-01-26T19:01:12Z")
            .with_author("ana")
            .build(),
        ]
        cli.storage.store_prs_with(pull_requests_data)

        result = cli.runner.invoke(
            main,
            [
                "prs",
                "review-time-by-author",
                "--top",
                "5",
                "--out-file",
                "output.png",
            ],
        )
        assert 0 == result.exit_code
        assert "ana       0.0" in result.output

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

        cli.storage.store_prs_with(data["prs"])

        result = cli.runner.invoke(
            main,
            [
                "prs",
                "review-time-by-author",
            ],
        )
        assert expected_output in result.output

    @pytest.mark.parametrize(
        "prs, expected_count",
        [
            pytest.param(
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
                "0",
            )
        ],
    )
    def test_with_stored_data_summary(self, cli, prs, expected_count):

        cli.storage.store_prs_with(prs)

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
        assert f"Total PRs: {expected_count}" in result.output

    def test_exports_csv_data(self, cli):
        cli.storage.store_prs_with(
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

        assert "Total PRs: 0" in result.output

    @pytest.mark.parametrize(
        "prs, expected_lines",
        [
            (
                [],
                [
                    "Total PRs: 0",
                    "Merged PRs: 0",
                    "Closed PRs: 0",
                    "PRs Without Conclusion: 0",
                    "Unique Authors: 0",
                    "Unique Labels: 0",
                ],
            ),
            (
                [
                    PullRequestBuilder()
                    .with_created_at("2025-09-02T00:50:00Z")
                    .with_author("eriirfos-eng")
                    .build()
                ],
                [
                    "Total PRs: 1",
                    "Merged PRs: 0",
                    "Closed PRs: 0",
                    "PRs Without Conclusion: 1",
                    "Unique Authors: 1",
                ],
            ),
        ],
    )
    def test_summary_lines_are_printed(self, cli, prs, expected_lines):
        # Arrange: store the test PRs

        cli.storage.store_prs_with(prs)

        # Act: invoke the summary command with text output
        result = cli.runner.invoke(
            main,
            [
                "prs",
                "summary",
                "--output",
                "text",
            ],
        )

        # Assert: each expected line is present in the output
        for line in expected_lines:
            assert line in result.output

    def test_full_summary_example_matches_expected_format(self, cli):
        # Build a realistic dataset matching the example in the request
        prs = [
            PullRequestBuilder()
            .with_number(1029)
            .with_title("Add files via upload")
            .with_author("eriirfos-eng")
            .with_created_at("2025-09-02T00:50:00Z")
            .build(),
            PullRequestBuilder()
            .with_number(1164)
            .with_title("Add Repository Tree Navigation Tool")
            .with_author("natagdunbar")
            .with_created_at("2025-09-30T19:12:17Z")
            .build(),
        ]

        # Add labels: we'll attach simple label summaries via repository behavior

        cli.storage.store_prs_with(prs)

        # Run the summary command
        result = cli.runner.invoke(
            main,
            [
                "prs",
                "summary",
                "--output",
                "text",
            ],
        )

        # Check several representative lines from the example output
        assert "PRs Summary:" in result.output
        assert "Total PRs: 2" in result.output
        assert "Unique Authors: 2" in result.output
        assert "First PR:" in result.output
        assert "Number: 1029" in result.output
        assert "Title: Add files via upload" in result.output
        assert "Author: eriirfos-eng" in result.output
        assert "Created: 2025-09-02T00:50:00Z" in result.output
        assert "Last PR:" in result.output
        assert "Number: 1164" in result.output
        assert "Title: Add Repository Tree Navigation Tool" in result.output
        assert "Author: natagdunbar" in result.output
        assert "Created: 2025-09-30T19:12:17Z" in result.output

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

        cli.storage.store_prs_with(data["prs"])

        result = cli.runner.invoke(
            main,
            ["prs", "average-open-by", "--aggregate-by", data["aggregate_by"]],
        )
        assert expected_output in result.output

    def test_fetch_prs_comments_between_dates(self, cli):

        pull_requests_data = [
            PullRequestBuilder().with_created_at("2023-01-26T19:01:12Z").build(),
        ]
        cli.storage.store_prs_with(pull_requests_data)

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

        pull_requests_data = [
            PullRequestBuilder().with_created_at("2023-01-26T19:01:12Z").build(),
        ]
        cli.storage.store_prs_with(pull_requests_data)

        pull_requests_comments_data = [
            PullRequestCommentsBuilder()
            .with_created_at("2023-01-27T19:01:12Z")
            .build(),
        ]

        cli.storage.store_prs_comment_with(pull_requests_comments_data)

        result = cli.runner.invoke(
            main,
            [
                "prs",
                "average-comments-by",
            ],
        )

        assert "{'x': [], 'y': [], 'period': []}" in result.output
