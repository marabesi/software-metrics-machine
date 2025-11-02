from apps.cli.main import main
import subprocess


class TestCliCodePairingIndexCommands:

    def test_defines_pairing_index_command(self, cli):
        result = cli.runner.invoke(
            main,
            ["code", "pairing-index", "--help"],
        )
        assert "Calculate pairing index for a git repository" in result.output
        assert result.stderr == ""

    def test_calculates_the_number_of_used_commits(self, cli):
        repository = cli.configuration.git_repository_location

        subprocess.run(["mkdir", "-p", f"{repository}"], capture_output=True, text=True)
        subprocess.run(
            ["git", "-C", repository, "init"], capture_output=True, text=True
        )
        subprocess.run(
            ["git", "-C", repository, "branch", "-m", "main"],
            capture_output=True,
            text=True,
        )
        subprocess.run(
            [
                "git",
                "-C",
                repository,
                "-c",
                "commit.gpgsign=false",
                "commit",
                "--author",
                "Author Name <email@example.com>",
                "--allow-empty",
                "-m",
                "feat: building app",
                "-m",
                "Co-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
            ],
            capture_output=True,
            text=True,
        )
        subprocess.run(["git", "-C", repository, "log"], capture_output=True, text=True)

        result = cli.runner.invoke(
            main,
            ["code", "pairing-index"],
        )

        assert "Total commits analyzed: 1" in result.output
