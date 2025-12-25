from ast import Tuple
import subprocess
import os
from git import List

from conftest_types import CliResult


class GitRepositoryResult:
    def __init__(self, cli: CliResult):
        self.repository_path = cli.configuration.git_repository_location

    def create_file(self, file_path: str, content: str = ""):
        """Create a file in the repository with optional content."""
        full_path = os.path.join(self.repository_path, file_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w") as f:
            f.write(content)
        return self

    def stage_all_file(self) -> GitRepositoryResult:
        subprocess.run(
            ["git", "-C", self.repository_path, "add", "."],
            capture_output=True,
            text=True,
        )
        return self

    def commit(self):
        """Return a small fluent helper to create commits with different authors."""

        repo = self.repository_path

        class CommitMaker:
            def __init__(self, repo_path: str):
                self.repo_path = repo_path
                self._author_name: str
                self._author_email: str
                self._message = "feat: building app"
                self.coauthors: List[Tuple[str, str]] = []
                self.date = None

            def with_author(self, name: str, email: str):
                self._author_name = name
                self._author_email = email
                return self

            def with_coauthor(self, name: str, email: str):
                self.coauthors.append((name, email))
                return self

            def with_date(self, date):
                self.date = date
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
                    "--allow-empty",
                    "--author",
                    f"{self._author_name} <{self._author_email}>",
                    "-m",
                    self._message,
                ]
                if self.date:
                    cmd.extend(["--date", self.date])
                if len(self.coauthors) > 0:
                    cmd.append("-m")
                    for coauthor in self.coauthors:
                        cmd.append(f"Co-authored-by: {coauthor[0]} <{coauthor[1]}>")

                subprocess.run(cmd, capture_output=True, text=True)
                return self

        return CommitMaker(repo)
