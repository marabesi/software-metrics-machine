from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Union


def _now_iso() -> str:
    return datetime.now(tz=timezone.utc).isoformat()


def _to_iso(value: Optional[Union[datetime, str]]) -> str:
    if value is None:
        return _now_iso()
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value)


@dataclass
class PullRequestBuilder:
    """Test helper to build pull request dicts used by tests.

    Usage:
        pr = (
            PullRequestBuilder()
            .with_number(42)
            .with_title("Fix bug")
            .with_author("alice")
            .with_comment(author="bob", body="LGTM")
            .build()
        )
    """

    number: int = 1
    title: str = ""
    body: str = ""
    author: str = "unknown"
    created_at: str = field(default_factory=_now_iso)
    closed_at: Optional[str] = None
    merged_at: Optional[str] = None
    review_comments_url: str = "unknown"
    comments: List[Dict[str, Any]] = field(default_factory=list)
    files_changed: List[str] = field(default_factory=list)
    labels: List[str] = field(default_factory=list)

    # builder methods
    def with_number(self, number: int) -> "PullRequestBuilder":
        self.number = number
        return self

    def with_title(self, title: str) -> "PullRequestBuilder":
        self.title = title
        return self

    def with_body(self, body: str) -> "PullRequestBuilder":
        self.body = body
        return self

    def with_author(self, author: str) -> "PullRequestBuilder":
        self.author = author
        return self

    def with_created_at(
        self, created_at: Optional[Union[datetime, str]]
    ) -> "PullRequestBuilder":
        self.created_at = _to_iso(created_at)
        return self

    def with_closed_at(
        self, closed_at: Optional[Union[datetime, str]]
    ) -> "PullRequestBuilder":
        self.closed_at = _to_iso(closed_at)
        return self

    def mark_merged(
        self, merged_at: Optional[Union[datetime, str]] = None
    ) -> "PullRequestBuilder":
        self.merged_at = _to_iso(merged_at)
        return self

    def with_review_comments_url(
        self, review_comments_url: str
    ) -> "PullRequestBuilder":
        self.review_comments_url = review_comments_url
        return self

    def with_comment(
        self, author: str, body: str, created_at: Optional[Union[datetime, str]] = None
    ) -> "PullRequestBuilder":
        comment = {
            "author": author,
            "body": body,
            "created_at": _to_iso(created_at),
        }
        self.comments.append(comment)
        return self

    def with_file_changed(self, path: str) -> "PullRequestBuilder":
        self.files_changed.append(path)
        return self

    def with_label(self, label: str) -> "PullRequestBuilder":
        self.labels.append(label)
        return self

    def build(self) -> Dict[str, Any]:
        """Return a dictionary representing the pull request similar to stored shape."""
        comments = [dict(c) for c in self.comments]
        pr: Dict[str, Any] = {
            "number": self.number,
            "title": self.title,
            "body": self.body,
            "author": self.author,
            "user": {"login": self.author},
            "created_at": self.created_at,
            "closed_at": self.closed_at,
            "merged_at": self.merged_at,
            "review_comments_url": self.review_comments_url,
            "comments": comments,
            "files_changed": list(self.files_changed),
            "labels": list(self.labels),
        }
        return pr


def pull_request_builder() -> PullRequestBuilder:
    """Convenience factory used by tests for readability."""
    return PullRequestBuilder()
