from __future__ import annotations

from dataclasses import dataclass

from software_metrics_machine.core.prs.pr_types import (
    PRLabels,
)


@dataclass
class PullRequestLabelBuilder:
    id: int = 1
    name: str = ""

    # builder methods
    def with_id(self, id: int) -> PullRequestLabelBuilder:
        self.id = id
        return self

    def with_name(self, name: str) -> PullRequestLabelBuilder:
        self.name = name
        return self

    def build(self) -> PRLabels:
        pr = PRLabels(
            **{
                "id": self.id,
                "name": self.name,
            }
        )
        return pr
