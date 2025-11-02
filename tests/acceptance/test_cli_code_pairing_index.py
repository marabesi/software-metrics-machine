from apps.cli.main import main


class TestCliCodePairingIndexCommands:

    def test_defines_pairing_index_command(self, cli):
        result = cli.runner.invoke(
            main,
            ["code", "pairing-index", "--help"],
        )
        assert "Calculate pairing index for a git repository" in result.output
        assert result.stderr == ""

    def test_calculates_the_number_of_used_commits(self, cli, git):
        git.commit_single_author()

        result = cli.runner.invoke(
            main,
            ["code", "pairing-index"],
        )

        assert "Total commits analyzed: 1" in result.output

    def test_calculates_the_number_of_paired_commits(self, cli, git):
        git.commit_two_authors()

        result = cli.runner.invoke(
            main,
            ["code", "pairing-index"],
        )

        assert "Total commits with co-authors: 1" in result.output
