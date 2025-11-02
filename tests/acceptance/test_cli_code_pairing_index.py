from unittest.mock import patch
from apps.cli.main import main
from core.code_types import TraverserResult
from tests.commit_builder import CommitBuilder


class TestCliCodePairingIndexCommands:

    def test_defines_pairing_index_command(self, cli):
        result = cli.runner.invoke(
            main,
            ["code", "pairing-index", "--help"],
        )
        assert "Calculate pairing index for a git repository" in result.output
        assert result.stderr == ""

    def test_calculates_the_number_of_used_commits(self, cli):
        with patch(
            "providers.pydriller.commit_traverser.CommitTraverser.traverse_commits"
        ) as mock_run:

            list_of_commits = [
                CommitBuilder().with_author("Alice").with_msg("Fix bug").build()
            ]

            mock_run.return_value = TraverserResult(
                total_analyzed_commits=1, commits=list_of_commits, paired_commits=0
            )

            result = cli.runner.invoke(
                main,
                ["code", "pairing-index"],
            )

            assert "Total commits analyzed: 1" in result.output
