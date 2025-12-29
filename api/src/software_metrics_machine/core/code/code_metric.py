import os
import fnmatch
import pandas as pd
from pydriller import Repository

from software_metrics_machine.core.code.code_metadata_types import CodeMetadataResult
from software_metrics_machine.core.infrastructure.logger import Logger
from software_metrics_machine.providers.codemaat.codemaat_repository import (
    CodemaatRepository,
)


class CodeMetric:

    def __init__(self, repository: CodemaatRepository):
        self.repository = repository
        self.logger = Logger(configuration=repository.configuration).get_logger()

    def analyze_code_changes(
        self,
        start_date: str | None = None,
        end_date: str | None = None,
        ignore: str | None = None,
        test_patterns: str | None = None,
    ) -> CodeMetadataResult:
        repo_path = self.repository.configuration.git_repository_location

        production_files = []
        test_files = []

        # prepare ignore patterns (relative paths, folder names or globs)
        ignore_list: list[str] = []
        if ignore:
            ignore_list = [
                p.strip().replace("\\", "/").rstrip("/")
                for p in ignore.split(",")
                if p.strip()
            ]

        # parse test patterns (glob-style) if provided
        test_patterns_list: list[str] = []
        if test_patterns:
            test_patterns_list = [
                p.strip().replace("\\", "/")
                for p in test_patterns.split(",")
                if p.strip()
            ]

        for root, _, files in os.walk(repo_path):
            if files:
                for file in files:
                    full = os.path.join(root, file)
                    # skip ignored paths (supports globs like '*.yml')
                    rel = os.path.relpath(full, repo_path).replace("\\", "/")
                    if self.__is_ignored_path(path=rel, ignore_list=ignore_list):
                        continue

                    # Determine whether this is a test file (by patterns or fallback heuristic)
                    if self.__is_test_path(rel, test_patterns_list):
                        test_files.append(full)
                    else:
                        production_files.append(full)

        if not production_files and not test_files:
            return CodeMetadataResult(
                message="No production and test files found in the repository."
            )

        start_date_dt = None
        end_date_dt = None
        if start_date:
            start_date_dt = pd.to_datetime(f"{start_date}T00:00:00Z").to_pydatetime()
        if end_date:
            end_date_dt = pd.to_datetime(f"{end_date}T00:00:00Z").to_pydatetime()
        # For each production file, count commits that touch it and, among those commits,
        # how many also touch any test file. Then compute the average fraction across
        # production files that had at least one commit.
        per_file_fractions = []

        self.logger.debug(
            f"Analyzing {len(production_files)} production files against {len(test_files)} test files."
        )

        for production_file in production_files:
            try:
                commits = list(
                    Repository(
                        path_to_repo=repo_path,
                        since=start_date_dt,
                        to=end_date_dt,
                        filepath=production_file,
                    ).traverse_commits()
                )

                seen_commits = set()
                commits_touching_tests = 0
                total_commits = 0

                commits_len = len(list(commits))
                if commits_len == 0:
                    return CodeMetadataResult(
                        message="No production files with commits found to analyze."
                    )

                print(
                    f"Analyzing production file: {production_file} - commits found: {len(list(commits))}"
                )
                for commit in commits:
                    ch = commit.hash
                    if ch in seen_commits:
                        continue
                    seen_commits.add(ch)
                    total_commits += 1

                    # If this commit modifies any path that looks like a test file,
                    # consider it a test-accompanied commit.
                    modified_paths = []
                    for mod in commit.modified_files:
                        if mod.new_path:
                            mp = mod.new_path.replace("\\", "/")
                            if self.__is_ignored_path(path=mp, ignore_list=ignore_list):
                                continue

                            modified_paths.append(mod.new_path)

                    touched_test = False
                    print(f"  Commit {ch} going through files. ")

                    for p in modified_paths:
                        if self.__is_test_path(p, test_patterns_list):
                            touched_test = True
                            print("  Commit touches test file: ", p)
                            break

                    if touched_test:
                        commits_touching_tests += 1

                if total_commits > 0:
                    fraction = commits_touching_tests / total_commits
                    per_file_fractions.append(fraction)
            except Exception as e:
                print(f"Error analyzing {production_file}: {e}")

        if per_file_fractions:
            avg_fraction = sum(per_file_fractions) / len(per_file_fractions)
            percent = avg_fraction * 100.0
            return CodeMetadataResult(
                message=f"Average fraction of production-file commits that also touch test files: {percent:.2f}%"
            )

        return CodeMetadataResult(
            message="No production files with commits found to analyze."
        )

    def __is_ignored_path(self, path: str, ignore_list: list | None) -> bool:
        if not ignore_list:
            return False
        pnorm = path.replace("\\", "/")
        # check glob patterns and substring/prefix matches
        for pattern in ignore_list:
            if pattern.startswith("*."):
                # match extension against basename
                if fnmatch.fnmatch(os.path.basename(pnorm), pattern):
                    return True
            # match full relative path glob
            if fnmatch.fnmatch(pnorm, pattern):
                return True
            # substring/prefix fallback
            if pnorm.startswith(pattern) or (pattern in pnorm):
                return True
        return False

    def __is_test_path(self, path: str, test_patterns_list: list | None) -> bool:
        pnorm = path.replace("\\", "/")
        if test_patterns_list:
            for pattern in test_patterns_list:
                if pattern.startswith("*."):
                    if fnmatch.fnmatch(os.path.basename(pnorm), pattern):
                        return True
                if fnmatch.fnmatch(pnorm, pattern) or (pattern in pnorm):
                    return True
            return False
        # fallback heuristic
        lname = os.path.basename(path).lower()
        lfull = path.lower()
        return ("test" in lname) or ("/tests/" in lfull) or ("/test/" in lfull)
