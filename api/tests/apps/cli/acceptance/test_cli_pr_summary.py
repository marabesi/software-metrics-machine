import pytest
from software_metrics_machine.apps.cli import main
from tests.prs_builder import PullRequestBuilder
from software_metrics_machine.core.prs.pr_types import PRLabels, PRDetails
from tests.prs_comment_builder import PullRequestCommentsBuilder
from typing import List


def prs_with_labels() -> List[PRDetails]:
    return [
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


def prs_with_authors() -> List[PRDetails]:
    return [
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


class TestCliPrsSummaryCommands:

    @pytest.mark.parametrize(
        "prs, command, expected_count",
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
                "Total PRs: 0",
                id="two prs outside date range",
            ),
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
                [
                    "prs",
                    "summary",
                    "--raw-filters",
                    "state=opened",
                ],
                "Total PRs: 0",
                id="filter by state",
            ),
        ],
    )
    def test_with_stored_data_summary(self, cli, prs, command, expected_count):
        cli.storage.store_prs_with(prs)

        result = cli.runner.invoke(main, command)

        assert expected_count in result.output

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
                    .with_created_at("2023-01-02T00:50:00Z")
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
            (
                [
                    PullRequestBuilder()
                    .with_created_at("2023-01-01T00:50:00Z")
                    .with_author("eriirfos-eng")
                    .with_label(PRLabels(id=1, name="bug"))
                    .build()
                ],
                [
                    "- bug: 1",
                ],
            ),
        ],
    )
    def test_summary_lines_are_printed(self, cli, prs, expected_lines):
        cli.storage.store_prs_with(prs)

        result = cli.runner.invoke(
            main,
            [
                "prs",
                "summary",
                "--output",
                "text",
                "--start-date",
                "2023-01-01",
                "--end-date",
                "2023-12-31",
            ],
        )

        for line in expected_lines:
            assert line in result.output

    @pytest.mark.parametrize(
        "prs, expected_lines",
        [
            pytest.param(
                prs_with_labels(),
                "Unique Labels: 2",
            ),
            pytest.param(
                prs_with_labels(),
                "- bug: 2 PRs",
            ),
            pytest.param(
                prs_with_labels(),
                "- enhancement: 1 PRs",
            ),
            pytest.param(prs_with_authors(), "PRs Summary:"),
            pytest.param(prs_with_authors(), "Total PRs: 2"),
            pytest.param(prs_with_authors(), "Unique Authors: 2"),
            pytest.param(prs_with_authors(), "First PR:"),
            pytest.param(prs_with_authors(), "Number: 1029"),
            pytest.param(prs_with_authors(), "Title: Add files via upload"),
            pytest.param(prs_with_authors(), "Author: eriirfos-eng"),
            pytest.param(prs_with_authors(), "Created: 2025-09-02T00:50:00Z"),
            pytest.param(prs_with_authors(), "Last PR:"),
            pytest.param(prs_with_authors(), "Number: 1164"),
            pytest.param(
                prs_with_authors(), "Title: Add Repository Tree Navigation Tool"
            ),
            pytest.param(prs_with_authors(), "Author: natagdunbar"),
            pytest.param(prs_with_authors(), "Created: 2025-09-30T19:12:17Z"),
            pytest.param(prs_with_authors(), "Average of comments per PR: 0"),
        ],
    )
    def test_renders_line(self, cli, prs, expected_lines):
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

        assert expected_lines in result.output

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

    def test_most_commented_pr_in_summary(self, cli):
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
            .with_body("A")
            .build(),
            PullRequestCommentsBuilder()
            .with_number(1029)
            .with_id(2)
            .with_body("B")
            .build(),
            PullRequestCommentsBuilder()
            .with_number(1164)
            .with_id(3)
            .with_body("C")
            .build(),
        ]

        cli.storage.store_prs_with(prs)
        cli.storage.store_prs_comment_with(prs_comments)

        result = cli.runner.invoke(
            main,
            ["prs", "summary", "--output", "text"],
        )

        assert "Most commented PR:" in result.output
        assert "Number: 1029" in result.output
        assert "Comments: 2" in result.output

    def test_top_commenter_in_summary(self, cli):
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
            .with_body("A")
            .with_user("alice")
            .build(),
            PullRequestCommentsBuilder()
            .with_number(1029)
            .with_id(2)
            .with_body("B")
            .with_user("bob")
            .build(),
            PullRequestCommentsBuilder()
            .with_number(1164)
            .with_id(3)
            .with_body("C")
            .with_user("alice")
            .build(),
        ]

        cli.storage.store_prs_with(prs)
        cli.storage.store_prs_comment_with(prs_comments)

        result = cli.runner.invoke(
            main,
            ["prs", "summary", "--output", "text"],
        )

        assert "Top commenter:" in result.output
        assert "Login: alice" in result.output
        assert "Comments: 2" in result.output

    def test_top_themes_in_summary(self, cli):
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
            .with_body("This improves performance significantly")
            .build(),
            PullRequestCommentsBuilder()
            .with_number(1029)
            .with_id(2)
            .with_body("We should refactor this for performance")
            .build(),
            PullRequestCommentsBuilder()
            .with_number(1164)
            .with_id(3)
            .with_body("This is a bug, please fix")
            .build(),
        ]

        cli.storage.store_prs_with(prs)
        cli.storage.store_prs_comment_with(prs_comments)

        result = cli.runner.invoke(
            main,
            ["prs", "summary", "--output", "text"],
        )

        assert "Top themes:" in result.output
        assert "performance: 2" in result.output

    def test_summary_filters_by_labels(self, cli):
        prs = prs_with_labels()
        cli.storage.store_prs_with(prs)

        result = cli.runner.invoke(
            main,
            [
                "prs",
                "summary",
                "--output",
                "text",
                "--labels",
                "enhancement",
            ],
        )

        assert "Total PRs: 1" in result.output
        assert "- enhancement: 1 PRs" in result.output

    def test_time_to_first_comment_shown_in_cli(self, cli):
        prs = [
            PullRequestBuilder()
            .with_number(301)
            .with_title("PR A")
            .with_author("alice")
            .with_created_at("2025-09-01T00:00:00Z")
            .build(),
            PullRequestBuilder()
            .with_number(302)
            .with_title("PR B")
            .with_author("bob")
            .with_created_at("2025-09-01T00:00:00Z")
            .build(),
            PullRequestBuilder()
            .with_number(303)
            .with_title("PR C")
            .with_author("carol")
            .with_created_at("2025-09-01T00:00:00Z")
            .build(),
        ]

        prs_comments = [
            PullRequestCommentsBuilder()
            .with_number(301)
            .with_id(1)
            .with_created_at("2025-09-01T02:00:00Z")
            .with_body("Nice work")
            .build(),
            PullRequestCommentsBuilder()
            .with_number(302)
            .with_id(2)
            .with_created_at("2025-09-01T14:00:00Z")
            .with_body("Please address")
            .build(),
        ]

        cli.storage.store_prs_with(prs)
        cli.storage.store_prs_comment_with(prs_comments)

        result = cli.runner.invoke(
            main,
            ["prs", "summary", "--output", "text"],
        )

        assert "Time to first comment (hours):" in result.output
        assert "Average: 8.0" in result.output
        assert "Median: 8.0" in result.output
        assert "Min: 2.0" in result.output
        assert "Max: 14.0" in result.output
        assert "PRs with comment: 2" in result.output
        assert "PRs without comment: 1" in result.output
