from typing import Iterable, Optional

from software_metrics_machine.core.code_types import PairingIndexResult
from software_metrics_machine.core.infrastructure.configuration.configuration import (
    Configuration,
)
from software_metrics_machine.core.infrastructure.logger import Logger
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
        self.logger = Logger(configuration=self.configuration).get_logger()

    def get_pairing_index(
        self,
        selected_authors: Optional[Iterable[str]] = None,
        start_date: str | None = None,
        end_date: str | None = None,
        authors: str | None = None,
        exclude_authors: str | None = None,
    ) -> PairingIndexResult:
        if authors:
            parsed = [a.strip() for a in authors.split(",") if a.strip()]
            if parsed:
                if selected_authors:
                    selected_authors = list(selected_authors) + parsed
                else:
                    selected_authors = parsed

        if selected_authors:
            self.logger.debug(f"Filtering commits to authors: {list(selected_authors)}")

        excluded_list = None
        if exclude_authors:
            excluded_list = [a.strip() for a in exclude_authors.split(",") if a.strip()]

        traverse = self.traverser.traverse_commits(
            selected_authors=selected_authors,
            excluded_authors=excluded_list,
            start_date=start_date,
            end_date=end_date,
        )
        total = traverse["total_analyzed_commits"]
        list_of_commits = total
        paired_commits = traverse["paired_commits"]

        self.logger.debug(f"Total commits analyzed: {list_of_commits}")

        if list_of_commits == 0:
            return PairingIndexResult(
                pairing_index_percentage=0.0,
                total_analyzed_commits=list_of_commits,
                paired_commits=0,
            )

        self.logger.debug(f"Total commits with co-authors: {paired_commits}")

        index = (paired_commits / list_of_commits) * 100
        pairing_index = float(f"{index:.2f}")

        return PairingIndexResult(
            pairing_index_percentage=pairing_index,
            total_analyzed_commits=list_of_commits,
            paired_commits=paired_commits,
        )
