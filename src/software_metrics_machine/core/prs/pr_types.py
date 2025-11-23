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


class PrUser(BaseModel):
    login: str


class PRLabels(BaseModel):
    id: int
    name: str


class PRDetails(BaseModel):
    number: int
    title: str
    user: PrUser
    created_at: str
    merged_at: Optional[str]
    closed_at: Optional[str]
    comments: List[PRComments]
    review_comments_url: str
    labels: List[PRLabels]
    html_url: str


class SummaryResult(TypedDict):
    total_prs: int
    merged_prs: int
    closed_prs: int
    without_conclusion: int
    unique_authors: int
    unique_labels: int
    labels: List[LabelSummary]
    first_pr: PRDetails
    last_pr: PRDetails
