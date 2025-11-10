from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, Optional


@dataclass
class PullRequestCommentsBuilder:
    body: str = ""
    created_at: str = field(default="")
    updated_at: Optional[str] = field(default="")

    def with_body(self, body: str) -> "PullRequestCommentsBuilder":
        self.body = body
        return self

    def with_created_at(self, created_at: str) -> "PullRequestCommentsBuilder":
        self.created_at = created_at
        return self

    def with_updated_at(self, updated_at: str) -> "PullRequestCommentsBuilder":
        self.updated_at = updated_at
        return self

    def build(self) -> Dict[str, Any]:
        comments: Dict[str, Any] = {
            "body": self.body,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
        return comments
