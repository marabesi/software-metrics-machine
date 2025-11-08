from typing import Iterable, Optional

from software_metrics_machine.core.code_types import PairingIndexResult
from software_metrics_machine.core.infrastructure.configuration.configuration import (
    Configuration,
)
from software_metrics_machine.providers.codemaat.codemaat_repository import (
    CodemaatRepository,
)
from software_metrics_machine.providers.pydriller.commit_traverser import (
    CommitTraverser,
)


class PairingIndex:
    def __init__(self, repository: CodemaatRepository):
        self.configuration: Configuration = repository.configuration
        self.traverser = CommitTraverser(configuration=self.configuration)

    def get_pairing_index(
        self,
        selected_authors: Optional[Iterable[str]] = None,
        start_date: str | None = None,
        end_date: str | None = None,
        authors: str | None = None,
    ) -> PairingIndexResult:
        """Compute pairing index, optionally filtering commits to only those by
        `selected_authors` (name or email, case-insensitive)."""

        if authors:
            parsed = [a.strip() for a in authors.split(",") if a.strip()]
            if parsed:
                if selected_authors:
                    selected_authors = list(selected_authors) + parsed
                else:
                    selected_authors = parsed

        if selected_authors:
            print(f"Filtering commits to authors: {list(selected_authors)}")

        traverse = self.traverser.traverse_commits(
            selected_authors=selected_authors, start_date=start_date, end_date=end_date
        )
        total = traverse["total_analyzed_commits"]
        list_of_commits = total
        paired_commits = traverse["paired_commits"]

        print(f"Total commits analyzed: {list_of_commits}")

        if list_of_commits == 0:
            return PairingIndexResult(
                pairing_index=0.0,
                total_analyzed_commits=list_of_commits,
                paired_commits=0,
            )

        print(f"Total commits with co-authors: {paired_commits}")

        index = (paired_commits / list_of_commits) * 100
        pairing_index = float(f"{index:.2f}")

        return PairingIndexResult(
            pairing_index=pairing_index,
            total_analyzed_commits=list_of_commits,
            paired_commits=paired_commits,
        )
