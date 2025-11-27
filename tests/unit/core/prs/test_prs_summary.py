from unittest.mock import patch

import pytest
from software_metrics_machine.core.prs.plots.view_summary import PrViewSummary
from software_metrics_machine.core.prs.prs_repository import PrsRepository
from tests.builders import as_json_string
from tests.in_memory_configuration import InMemoryConfiguration
from tests.prs_builder import PullRequestBuilder
from tests.prs_comment_builder import PullRequestCommentsBuilder


class TestPrsSummary:

    def test_empty_prs_summary(self):
        def mocked_read_file_if_exists(file):
            if file == "prs.json":
                return as_json_string([])
            if file == "prs_review_comments.json":
                return as_json_string([])
            return None

        with patch(
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            loader = PrsRepository(configuration=InMemoryConfiguration("."))
            ps = PrViewSummary(repository=loader)

            s = ps.main()

            assert s["avg_comments_per_pr"] == 0

    @pytest.mark.parametrize(
        "prs,comments,expected_avg",
        [
            ([], [], 0),
            (
                [
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
                ],
                [
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
                ],
                1,
            ),
            (
                [
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
                ],
                [
                    PullRequestCommentsBuilder()
                    .with_number(1029)
                    .with_id(1)
                    .with_body("Looks good to me!")
                    .build(),
                ],
                0.5,
            ),
        ],
    )
    def test_plots_average_number_of_comments(self, prs, comments, expected_avg):
        def mocked_read_file_if_exists(file):
            if file == "prs.json":
                return as_json_string(prs)
            if file == "prs_review_comments.json":
                return as_json_string(comments)
            return None

        with patch(
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            loader = PrsRepository(configuration=InMemoryConfiguration("."))
            ps = PrViewSummary(repository=loader)

            s = ps.main()

            assert s["avg_comments_per_pr"] == expected_avg

    def test_top_themes_in_summary(self):
        # two PRs and a set of comments where 'tests' is the most frequent token
        prs = [
            PullRequestBuilder()
            .with_number(101)
            .with_title("Improve CI")
            .with_author("alice")
            .with_created_at("2025-09-01T00:00:00Z")
            .build(),
            PullRequestBuilder()
            .with_number(102)
            .with_title("Refactor module")
            .with_author("bob")
            .with_created_at("2025-09-02T00:00:00Z")
            .build(),
        ]

        comments = [
            PullRequestCommentsBuilder()
            .with_number(101)
            .with_id(1)
            .with_body("These tests are flaky, we should add more tests")
            .build(),
            PullRequestCommentsBuilder()
            .with_number(101)
            .with_id(2)
            .with_body("Also consider a refactor of the module, and add tests")
            .build(),
            PullRequestCommentsBuilder()
            .with_number(102)
            .with_id(3)
            .with_body("Refactor completed, running tests locally")
            .build(),
            PullRequestCommentsBuilder()
            .with_number(102)
            .with_id(4)
            .with_body("Minor typo fixed")
            .build(),
        ]

        def mocked_read_file_if_exists(file):
            if file == "prs.json":
                return as_json_string(prs)
            if file == "prs_review_comments.json":
                return as_json_string(comments)
            return None

        with patch(
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            loader = PrsRepository(configuration=InMemoryConfiguration("."))
            ps = PrViewSummary(repository=loader)

            s = ps.main()

            top = s["top_themes"]
            assert top[0]["theme"] == "tests"
            assert top[0]["count"] == 4
