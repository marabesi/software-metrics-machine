from unittest.mock import patch

import pytest
from core.code.pairing_index import PairingIndex
from core.code_types import TraverserResult
from src.providers.codemaat.codemaat_repository import CodemaatRepository
from tests.commit_builder import CommitBuilder
from tests.in_memory_configuration import InMemoryConfiguration


class TestPairingIndex:

    @pytest.mark.parametrize(
        "commits, expected_analysis_count",
        [
            (
                [CommitBuilder().with_author("Alice").with_msg("Fix bug").build()],
                1,
            ),
            (
                [
                    CommitBuilder().with_author("Alice").with_msg("Fix bug").build(),
                    CommitBuilder().with_author("Alice").with_msg("Fix bug").build(),
                ],
                2,
            ),
        ],
    )
    def test_calculates_number_of_commits_analyzed(
        self, commits, expected_analysis_count
    ):
        with patch(
            "src.providers.pydriller.commit_traverser.CommitTraverser.traverse_commits"
        ) as mock_run:
            list_of_commits = commits

            mock_run.return_value = TraverserResult(
                total_analyzed_commits=len(list_of_commits),
                commits=list_of_commits,
                paired_commits=0,
            )

            repository = CodemaatRepository(configuration=InMemoryConfiguration("."))
            pairing_index = PairingIndex(repository=repository)

            result = pairing_index.get_pairing_index()

            assert expected_analysis_count == result["total_analyzed_commits"]

    @pytest.mark.parametrize(
        "commits, expected_paired_count",
        [
            (
                [CommitBuilder().with_author("Alice").with_msg("Fix bug").build()],
                0,
            ),
            (
                [
                    CommitBuilder()
                    .with_author("Jorge")
                    .with_msg(
                        "Co-authored-by: dependabot[bot] <bot@noreply.github.com>"
                    )
                    .build(),
                ],
                1,
            ),
        ],
    )
    def test_calculates_number_of_paired_commits(self, commits, expected_paired_count):
        with patch(
            "src.providers.pydriller.commit_traverser.CommitTraverser.traverse_commits"
        ) as mock_run:
            list_of_commits = commits

            mock_run.return_value = TraverserResult(
                total_analyzed_commits=len(list_of_commits),
                commits=list_of_commits,
                paired_commits=expected_paired_count,
            )

            repository = CodemaatRepository(configuration=InMemoryConfiguration("."))
            pairing_index = PairingIndex(repository=repository)

            result = pairing_index.get_pairing_index()

            assert expected_paired_count == result["paired_commits"]

    @pytest.mark.parametrize(
        "commits, expected",
        [
            (
                [],
                {"paired_commits": 0, "pairing_index": 0.0},
            ),
            (
                [CommitBuilder().with_author("Alice").with_msg("Fix bug").build()],
                {"paired_commits": 0, "pairing_index": 0.0},
            ),
            (
                [
                    CommitBuilder().with_author("Alice").with_msg("Fix bug").build(),
                    CommitBuilder().with_author("John").with_msg("Fix bug").build(),
                    CommitBuilder()
                    .with_author("Jorge")
                    .with_msg(
                        "Co-authored-by: dependabot[bot] <bot@noreply.github.com>"
                    )
                    .build(),
                ],
                {"paired_commits": 1, "pairing_index": 33.33},
            ),
            (
                [
                    CommitBuilder()
                    .with_author("Jorge")
                    .with_msg(
                        "Co-authored-by: dependabot[bot] <bot@noreply.github.com>"
                    )
                    .build(),
                ],
                {"paired_commits": 1, "pairing_index": 100.0},
            ),
            (
                [
                    CommitBuilder()
                    .with_author("Maria")
                    .with_date("2024-05-01 12:00:00 +0000")
                    .build(),
                ],
                {"paired_commits": 0, "pairing_index": 0.0},
            ),
        ],
    )
    def test_calculates_pairing_index(self, commits, expected):
        with patch(
            "src.providers.pydriller.commit_traverser.CommitTraverser.traverse_commits"
        ) as mock_run:
            paired = expected["paired_commits"]
            index = expected["pairing_index"]
            list_of_commits = commits

            mock_run.return_value = TraverserResult(
                total_analyzed_commits=len(list_of_commits),
                commits=list_of_commits,
                paired_commits=paired,
            )

            repository = CodemaatRepository(configuration=InMemoryConfiguration("."))
            pairing_index = PairingIndex(repository=repository)

            result = pairing_index.get_pairing_index()

            assert index == result["pairing_index"]

    def test_respects_selected_authors_filter(self):
        with patch(
            "src.providers.pydriller.commit_traverser.CommitTraverser.traverse_commits"
        ) as mock_run:
            mock_run.return_value = TraverserResult(
                total_analyzed_commits=2, commits=[], paired_commits=1
            )

            repository = CodemaatRepository(configuration=InMemoryConfiguration("."))
            pairing_index = PairingIndex(repository=repository)

            authors = ["alice@example.com", "bob"]
            result = pairing_index.get_pairing_index(selected_authors=authors)

            mock_run.assert_called_once()
            called_kwargs = mock_run.call_args.kwargs
            assert "selected_authors" in called_kwargs
            assert list(called_kwargs["selected_authors"]) == authors

            assert result["total_analyzed_commits"] == 2
            assert result["paired_commits"] == 1
