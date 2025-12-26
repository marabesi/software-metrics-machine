from __future__ import annotations

from pydantic import BaseModel
from typing import TypedDict, List, Optional


class LabelSummary(TypedDict):
    label_name: str
    prs_count: int


class PRComments(BaseModel):
    id: int
    body: str
    created_at: str
    updated_at: str
    pull_request_url: str
    user: PrUser | None = None


class PrUser(BaseModel):
    login: str


class PRLabels(BaseModel):
    id: int
    name: str


class PRDetails(BaseModel):
    id: int
    number: int
    title: str
    user: PrUser
    created_at: str
    merged_at: Optional[str]
    closed_at: Optional[str]
    state: str
    comments: List[PRComments] = []
    review_comments_url: str
    labels: List[PRLabels] = []
    html_url: str


class SummaryResult(TypedDict):
    avg_comments_per_pr: float
    total_prs: int
    merged_prs: int
    closed_prs: int
    without_conclusion: int
    unique_authors: int
    unique_labels: int
    labels: List[LabelSummary]
    first_pr: PRDetails
    last_pr: PRDetails
    most_commented_pr: dict
    top_commenter: dict
    top_themes: List[dict]
    first_comment_time_stats: dict


class PRFilters(TypedDict, total=False):
    start_date: Optional[str]
    end_date: Optional[str]
    authors: Optional[str]
    labels: Optional[str]
    raw_filters: Optional[str]
