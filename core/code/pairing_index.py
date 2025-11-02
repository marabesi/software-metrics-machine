from core.code_types import PairingIndexResult
from core.infrastructure.configuration.configuration import Configuration
from providers.codemaat.codemaat_repository import CodemaatRepository
from providers.pydriller.commit_traverser import CommitTraverser


class PairingIndex:
    def __init__(self, repository: CodemaatRepository):
        self.configuration: Configuration = repository.configuration
        self.traverser = CommitTraverser(configuration=self.configuration)

    def get_pairing_index(self) -> PairingIndexResult:
        traverse = self.traverser.traverse_commits()
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
