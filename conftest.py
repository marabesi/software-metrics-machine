from dataclasses import dataclass
import functools
import os
import subprocess
import pytest
import sys
from click.testing import CliRunner

from core.infrastructure.configuration.configuration import Configuration
from core.infrastructure.configuration.configuration_file_system_handler import (
    ConfigurationFileSystemHandler,
)
from tests.in_memory_configuration import InMemoryConfiguration


@pytest.fixture(scope="module")
def cli_only():
    """Yield a click.testing.CliRunner to invoke the CLI."""
    class_ = CliRunner

    def invoke_wrapper(f):
        """Augment CliRunner.invoke to emit its output to stdout.
        This enables pytest to show the output in its logs on test failures.
        """

        @functools.wraps(f)
        def wrapper(*args, **kwargs):
            result = f(*args, **kwargs)
            if result.exit_code != 0:  # Show output only on error
                sys.stdout.write(result.output)
            return result

        return wrapper

    class_.invoke = invoke_wrapper(class_.invoke)
    cli_runner = class_()
    with cli_runner.isolated_filesystem():
        yield cli_runner


class GitRepositoryResult:
    def __init__(self, cli):
        self.repository_path = cli.configuration.git_repository_location

    def commit_single_author(self):
        subprocess.run(
            [
                "git",
                "-C",
                self.repository_path,
                "-c",
                "commit.gpgsign=false",
                "commit",
                "--author",
                "Author Name <email@example.com>",
                "--allow-empty",
                "-m",
                "feat: building app",
            ],
            capture_output=True,
            text=True,
        )

    def commit_two_authors(self):
        subprocess.run(
            [
                "git",
                "-C",
                self.repository_path,
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

    def commit(self):
        """Return a small fluent helper to create commits with different authors."""

        repo = self.repository_path

        class CommitMaker:
            def __init__(self, repo_path: str):
                self.repo_path = repo_path
                self._author_name = None
                self._author_email = None
                self._message = "feat: building app"

            def with_author(self, name: str, email: str):
                self._author_name = name
                self._author_email = email
                return self

            def with_message(self, message: str):
                self._message = message
                return self

            def execute(self):
                cmd = [
                    "git",
                    "-C",
                    self.repo_path,
                    "-c",
                    "commit.gpgsign=false",
                    "commit",
                    "--author",
                    f"{self._author_name} <{self._author_email}>",
                    "--allow-empty",
                    "-m",
                    self._message,
                ]

                subprocess.run(cmd, capture_output=True, text=True)
                return self

        return CommitMaker(repo)


@pytest.fixture
def git(cli):
    repository = cli.configuration.git_repository_location

    subprocess.run(["mkdir", "-p", f"{repository}"], capture_output=True, text=True)
    subprocess.run(["git", "-C", repository, "init"], capture_output=True, text=True)
    subprocess.run(
        ["git", "-C", repository, "branch", "-m", "main"],
        capture_output=True,
        text=True,
    )
    yield GitRepositoryResult(cli)


@dataclass
class CliResult:
    runner: CliRunner
    data_stored_at: str
    configuration: Configuration


@pytest.fixture
def cli(cli_only, tmp_path):
    path_string = str(tmp_path)

    os.environ["SMM_STORE_DATA_AT"] = path_string
    configuration = InMemoryConfiguration(path_string)

    ConfigurationFileSystemHandler(path_string).store_file(
        "smm_config.json", configuration
    )

    yield CliResult(
        runner=cli_only, data_stored_at=path_string, configuration=configuration
    )
