import pytest
from software_metrics_machine.apps.cli import main
from tests.prs_builder import PullRequestBuilder
from software_metrics_machine.core.prs.pr_types import PRLabels
from tests.prs_comment_builder import PullRequestCommentsBuilder


class TestCliPrsSummaryCommands:

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

        for line in expected_lines:
            assert line in result.output

    def test_full_summary_example_matches_expected_format(self, cli):
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

        cli.storage.store_prs_with(prs)

        result = cli.runner.invoke(
            main,
            [
                "prs",
                "summary",
                "--output",
                "text",
            ],
        )

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
        assert "Average of comments per PR: 0" in result.output

    def test_pr_labels_are_listed_with_counts(self, cli):
        prs = [
            PullRequestBuilder()
            .with_number(1)
            .with_title("Fix issue")
            .with_author("alice")
            .with_created_at("2025-10-01T00:00:00Z")
            .with_label(PRLabels(id=1, name="bug"))
            .build(),
            PullRequestBuilder()
            .with_number(2)
            .with_title("Add feature")
            .with_author("bob")
            .with_created_at("2025-10-02T00:00:00Z")
            .with_label(PRLabels(id=2, name="enhancement"))
            .with_label(PRLabels(id=1, name="bug"))
            .build(),
        ]

        cli.storage.store_prs_with(prs)

        result = cli.runner.invoke(
            main,
            [
                "prs",
                "summary",
                "--output",
                "text",
            ],
        )

        assert "Unique Labels: 2" in result.output
        assert "- bug: 2 PRs" in result.output
        assert "- enhancement: 1 PRs" in result.output

    def test_output_average_of_comments_by_prs(self, cli):
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

        prs_comments = [
            PullRequestCommentsBuilder()
            .with_number(1029)
            .with_id(1)
            .with_body("Looks good to me!")
            .build(),
            PullRequestCommentsBuilder()
            .with_number(1164)
            .with_id(2)
            .with_body("Please address the comments.")
            .build(),
        ]

        cli.storage.store_prs_with(prs)
        cli.storage.store_prs_comment_with(prs_comments)

        result = cli.runner.invoke(
            main,
            [
                "prs",
                "summary",
                "--output",
                "text",
            ],
        )

        assert "Average of comments per PR: 1" in result.output
