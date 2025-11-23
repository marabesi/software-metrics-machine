from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, Optional

from software_metrics_machine.core.prs.pr_types import PRComments


@dataclass
class PullRequestCommentsBuilder:
    id: int = 1
    number: str = ""
    body: str = ""
    created_at: str = field(default="")
    updated_at: Optional[str] = field(default="")
    pull_request_url: str = field(default="")

    def with_body(self, body: str) -> "PullRequestCommentsBuilder":
        self.body = body
        return self

    def with_number(self, number: int) -> "PullRequestCommentsBuilder":
        self.number = number
        return self

    def with_created_at(self, created_at: str) -> "PullRequestCommentsBuilder":
        self.created_at = created_at
        return self

    def with_updated_at(self, updated_at: str) -> "PullRequestCommentsBuilder":
        self.updated_at = updated_at
        return self

    def with_pull_request_url(
        self, pull_request_url: str
    ) -> "PullRequestCommentsBuilder":
        self.pull_request_url = pull_request_url
        return self

    def build(self) -> Dict[str, Any]:
        comments = PRComments(
            **{
                "id": self.id,
                "body": self.body,
                "created_at": self.created_at,
                "updated_at": self.updated_at,
                "pull_request_url": self.pull_request_url,
            }
        )
        return comments
