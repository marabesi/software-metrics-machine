from software_metrics_machine.apps.cli import main


class TestCliCodePairingIndexCommands:

    def test_defines_pairing_index_command(self, cli):
        result = cli.runner.invoke(
            main,
            ["code", "pairing-index", "--help"],
        )
        assert "Calculate pairing index for a git repository" in result.output
        assert result.stderr == ""

    def test_calculates_the_number_of_used_commits(self, cli, git):
        git.commit().with_author("John Doe", "email@example.com").execute()

        result = cli.runner.invoke(
            main,
            ["code", "pairing-index"],
        )

        assert "0.0 %" in result.output

    def test_calculates_the_number_of_paired_commits(self, cli, git):
        git.commit().with_author("John Doe", "email@example.com").with_coauthor(
            "Maria Doe", "maria@example.com"
        ).execute()

        result = cli.runner.invoke(
            main,
            ["code", "pairing-index"],
        )

        assert "100.0 %" in result.output

    def test_calculates_the_number_of_used_commits_contrainted_by_start_date(
        self, cli, git
    ):
        git.commit().with_author("John Doe", "email@example.com").with_date(
            "2025-11-05 10:00:00 +0000"
        ).execute()

        result = cli.runner.invoke(
            main,
            ["code", "pairing-index", "--start-date", "2026-01-01"],
        )

        assert "0.0 %" in result.output

    def test_calculates_the_number_of_used_commits_contrainted_by_end_date(
        self, cli, git
    ):
        git.commit().with_author("John Doe", "email@example.com").with_date(
            "2025-11-05 10:00:00 +0000"
        ).execute()

        result = cli.runner.invoke(
            main,
            ["code", "pairing-index", "--end-date", "2024-01-01"],
        )

        assert "0.0 %" in result.output

    def test_cli_filters_commits_by_author_flag(self, cli, git):
        git.commit().with_author("John Doe", "john@example.com").execute()
        git.commit().with_author("Alice", "alice@example.com").execute()

        result = cli.runner.invoke(
            main,
            ["code", "pairing-index", "--authors", "john@example.com"],
        )

        assert "0.0 %" in result.output

    def test_print_pairing_index(self, cli, git):
        git.commit().with_author("John Doe", "john@example.com").with_coauthor(
            "Maria", "chec@check.com"
        ).execute()

        result = cli.runner.invoke(
            main,
            ["code", "pairing-index"],
        )

        assert "100.0 %" in result.output
