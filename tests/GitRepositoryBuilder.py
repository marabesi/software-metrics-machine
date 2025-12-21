from ast import Tuple
import subprocess
from git import List


class GitRepositoryResult:
    def __init__(self, cli):
        self.repository_path = cli.configuration.git_repository_location

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
