from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from software_metrics_machine.core.prs.pr_types import (
    PRDetails,
    PrUser,
    PRComments,
    PRLabels,
)


@dataclass
class PullRequestBuilder:
    id: int = 1
    number: int = 1
    title: str = ""
    body: str = ""
    author: str = "unknown"
    created_at: str = "2023-10-10T00:00:00Z"
    closed_at: Optional[str] = None
    merged_at: Optional[str] = None
    review_comments_url: str = "unknown"
    comments: List[Dict[str, Any]] = field(default_factory=list)
    files_changed: List[str] = field(default_factory=list)
    labels: List[PRLabels] = field(default_factory=list)
    html_url: str = "https://github.com/org/repo/pull/1"
    state: str = "open"

    def with_id(self, id: int) -> PullRequestBuilder:
        self.id = id
        return self

    def with_number(self, number: int) -> PullRequestBuilder:
        self.number = number
        return self

    def with_title(self, title: str) -> PullRequestBuilder:
        self.title = title
        return self

    def with_body(self, body: str) -> PullRequestBuilder:
        self.body = body
        return self

    def with_author(self, author: str) -> PullRequestBuilder:
        self.author = author
        return self

    def with_created_at(self, created_at: str) -> PullRequestBuilder:
        self.created_at = created_at
        return self

    def with_closed_at(self, closed_at: str) -> PullRequestBuilder:
        self.closed_at = closed_at
        return self

    def mark_merged(self, merged_at: str) -> PullRequestBuilder:
        self.merged_at = merged_at
        return self

    def with_html_url(self, html_url: str) -> PullRequestBuilder:
        self.html_url = html_url
        return self

    def with_review_comments_url(self, review_comments_url: str) -> PullRequestBuilder:
        self.review_comments_url = review_comments_url
        return self

    def with_comment(
        self, author: str, body: str, created_at: str
    ) -> "PullRequestBuilder":
        comment = {
            "author": author,
            "body": body,
            "created_at": created_at,
        }
        self.comments.append(comment)
        return self

    def with_file_changed(self, path: str) -> PullRequestBuilder:
        self.files_changed.append(path)
        return self

    def with_label(self, label: PRLabels) -> PullRequestBuilder:
        self.labels.append(label)
        return self

    def with_state(self, state: str) -> PullRequestBuilder:
        self.state = state
        return self

    def build(self) -> Dict[str, Any]:
        comments: List[PRComments] = [c for c in self.comments]
        pr = PRDetails(
            **{
                "id": self.id,
                "number": self.number,
                "title": self.title,
                "body": self.body,
                "user": PrUser(**{"login": self.author}),
                "created_at": self.created_at,
                "closed_at": self.closed_at,
                "merged_at": self.merged_at,
                "review_comments_url": self.review_comments_url,
                "comments": comments,
                "labels": list(self.labels),
                "html_url": self.html_url,
                "state": self.state,
            }
        )
        return pr


def pull_request_builder() -> PullRequestBuilder:
    return PullRequestBuilder()
