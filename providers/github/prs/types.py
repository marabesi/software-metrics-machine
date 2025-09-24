from typing import TypedDict, List, Union


class LabelSummary(TypedDict):
    label_name: str
    prs_count: int


class PRDetails(TypedDict):
    number: Union[str, None]
    title: Union[str, None]
    login: Union[str, None]
    created: Union[str, None]
    merged: Union[str, None]
    closed: Union[str, None]


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
