import pytest
from software_metrics_machine.apps.cli import main
from unittest.mock import patch
from tests.prs_builder import PullRequestBuilder
from tests.prs_comment_builder import PullRequestCommentsBuilder
from tests.response_builder import build_http_successfull_response
from software_metrics_machine.core.prs.pr_types import PRLabels


class TestCliPrCommentsCommands:

    @pytest.fixture(scope="class", autouse=True)
    def reset_mock_get(self):
        with patch("requests.get") as mock_get:
            mock_get.reset_mock()
            yield mock_get

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

    def test_average_comments_filters_by_label(self, cli):
        prs = [
            PullRequestBuilder()
            .with_number(1)
            .with_created_at("2023-10-01T00:00:00Z")
            .mark_merged("2023-10-02T00:00:00Z")
            .with_label(PRLabels(id=1, name="bug"))
            .build(),
            PullRequestBuilder()
            .with_number(2)
            .with_created_at("2024-10-01T00:00:00Z")
            .mark_merged("2024-10-02T00:00:00Z")
            .with_label(PRLabels(id=2, name="enhancement"))
            .build(),
        ]

        cli.storage.store_prs_with(prs)

        comments = [
            PullRequestCommentsBuilder()
            .with_number(1)
            .with_id(1)
            .with_body("Looks good")
            .with_created_at("2023-10-01T12:00:00Z")
            .build(),
            PullRequestCommentsBuilder()
            .with_number(2)
            .with_id(2)
            .with_body("Please change")
            .with_created_at("2023-10-01T12:00:00Z")
            .build(),
        ]

        cli.storage.store_prs_comment_with(comments)

        result = cli.runner.invoke(
            main,
            [
                "prs",
                "average-comments-by",
                "--labels",
                "bug",
                "--aggregate-by",
                "month",
            ],
        )

        out = result.output

        assert (
            "{'x': [Timestamp('2023-10-01 00:00:00')], 'y': [1.0], 'period': ['2023-10']}"
            in out
        )
