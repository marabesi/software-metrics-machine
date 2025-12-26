from datetime import datetime
import re
from software_metrics_machine.core.infrastructure.pandas import pd
from pydriller import Repository
from typing import Iterable, Optional, Tuple
from software_metrics_machine.core.code_types import TraverserResult
from software_metrics_machine.core.infrastructure.configuration.configuration import (
    Configuration,
)


class CommitTraverser:
    def __init__(self, configuration: Configuration):
        self.configuration = configuration

    def traverse_commits(
        self,
        selected_authors: Optional[Iterable[str]] = None,
        excluded_authors: Optional[Iterable[str]] = None,
        include_coauthors: bool = False,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> TraverserResult:
        selected_keys = None
        if selected_authors:
            selected_keys = {
                s.strip().lower() for s in selected_authors if s and s.strip()
            }

        excluded_keys = None
        if excluded_authors:
            excluded_keys = {
                s.strip().lower() for s in excluded_authors if s and s.strip()
            }

        total_commits = 0
        paired_commits_count = 0

        repo_path = self.configuration.git_repository_location

        print(f"Analyzing repository at: {repo_path}\n")

        parsed_start_date: datetime | None = None
        parsed_end_date: datetime | None = None

        if start_date:
            parsed_start_date = pd.to_datetime(f"{start_date} 00:00:00").to_pydatetime()

        if end_date:
            parsed_end_date = pd.to_datetime(f"{end_date} 00:00:00").to_pydatetime()

        # We traverse the commits in the repository
        commits_from_repo = Repository(
            path_to_repo=repo_path, since=parsed_start_date, to=parsed_end_date
        ).traverse_commits()
        for commit in commits_from_repo:
            # Determine whether this commit should be included based on selected_authors
            author_name = getattr(commit.author, "name", "") or ""
            author_email = getattr(commit.author, "email", "") or ""
            author_key = self._normalize_author_key(author_name, author_email)

            # Parse co-authors from the commit message
            commit_message = commit.msg or ""
            co_authors = []
            for line in commit_message.splitlines():
                if line.strip().lower().startswith("co-authored-by:"):
                    parsed = self.__parse_co_author(line)
                    if parsed:
                        co_authors.append(parsed)  # (name, email)

            # Determine whether to include this commit based on selected/excluded keys
            include_commit = True

            if excluded_keys is not None and author_key in excluded_keys:
                include_commit = False

            if selected_keys is not None:
                # If author is explicitly selected, include regardless of coauthors
                if author_key in selected_keys:
                    include_commit = True
                else:
                    # Optionally include if any co-author matches selected keys
                    if include_coauthors and co_authors:
                        match = False
                        for name, email in co_authors:
                            if self._normalize_author_key(name, email) in selected_keys:
                                match = True
                                break
                        include_commit = match
                    else:
                        include_commit = False

            if not include_commit:
                continue

            total_commits += 1

            if co_authors:
                paired_commits_count += 1

        return TraverserResult(
            total_analyzed_commits=total_commits,
            paired_commits=paired_commits_count,
            commits=commits_from_repo,
        )

    def _normalize_author_key(self, name: str, email: str) -> str:
        return (email or name).strip().lower()

    def __parse_co_author(self, trailer_line: str) -> Optional[Tuple[str, str]]:
        m = re.search(r"co-authored-by:\s*(.+?)\s*<([^>]+)>", trailer_line, flags=re.I)
        if not m:
            return None
        name = m.group(1).strip()
        email = m.group(2).strip()
        return name, email
