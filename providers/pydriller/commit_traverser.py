from core.code_types import TraverserResult
from core.infrastructure.configuration.configuration import Configuration


class CommitTraverser:
    def __init__(self, configuration: Configuration):
        self.configuration = configuration

    def traverse_commits(self) -> TraverserResult:
        raise NotImplementedError(
            "This method should be implemented commit_traverser::to traverse commits."
        )
