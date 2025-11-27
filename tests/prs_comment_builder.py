from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, Optional

from software_metrics_machine.core.prs.pr_types import PRComments


@dataclass
class PullRequestCommentsBuilder:
    id: int = 1
    number: int = 1
    body: str = ""
    created_at: str = field(default="")
    updated_at: Optional[str] = field(default="")
    user_login: Optional[str] = field(default=None)

    def with_id(self, id: int) -> PullRequestCommentsBuilder:
        self.id = id
        return self

    def with_body(self, body: str) -> PullRequestCommentsBuilder:
        self.body = body
        return self

    def with_number(self, number: int) -> PullRequestCommentsBuilder:
        self.number = number
        return self

    def with_created_at(self, created_at: str) -> PullRequestCommentsBuilder:
        self.created_at = created_at
        return self

    def with_updated_at(self, updated_at: str) -> PullRequestCommentsBuilder:
        self.updated_at = updated_at
        return self

    def with_user(self, login: str) -> PullRequestCommentsBuilder:
        self.user_login = login
        return self

    def build(self) -> Dict[str, Any]:
        payload = {
            "id": self.id,
            "body": self.body,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "pull_request_url": f"/{self.number}",
        }
        if self.user_login:
            payload["user"] = {"login": self.user_login}

        comments = PRComments(**payload)
        return comments
