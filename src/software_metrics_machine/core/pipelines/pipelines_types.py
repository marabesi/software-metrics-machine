from enum import Enum
from typing import List, Optional, Union
from typing_extensions import TypedDict


from pydantic import BaseModel

StrOrInt = Union[str, int]


class PipelineJobStepStatus(str, Enum):
    queued = "queued"
    in_progress = "in_progress"
    completed = "completed"


class PipelineJobStep(TypedDict, total=False):
    number: int
    name: str
    status: str
    conclusion: Optional[str]
    created_at: Optional[str]
    started_at: Optional[str]
    completed_at: Optional[str]


class PipelineJobConclusion(str, Enum):
    success = "success"
    failure = "failure"
    neutral = "neutral"
    cancelled = "cancelled"
    skipped = "skipped"
    timed_out = "timed_out"
    action_required = "action_required"


class PipelineJob(BaseModel):
    id: int
    run_id: int
    name: str
    status: str
    conclusion: Optional[str]
    created_at: str
    started_at: str
    completed_at: Optional[str]
    workflow_name: str
    html_url: Optional[str]
    head_branch: str
    labels: List[str]
    run_attempt: int
    steps: List[PipelineJobStep] = []


class PipelineRun(BaseModel):
    id: int
    path: str
    name: Optional[str]
    short_name: Optional[str] = None
    created_at: str
    run_started_at: str
    updated_at: Optional[str]
    event: str
    head_branch: Optional[str]
    status: Optional[str]
    conclusion: Optional[str]
    jobs: List[PipelineJob] = []
    html_url: str
    duration_in_minutes: Optional[float] = None


class DeploymentFrequency(TypedDict):
    days: List[str]
    weeks: List[str]
    daily_counts: List[str]
    weekly_counts: List[str]
    monthly_counts: List[str]


class PipelineFilters(TypedDict):
    start_date: Optional[str]
    end_date: Optional[str]
    target_branch: Optional[str]
    event: Optional[str]
    workflow_path: Optional[str]
    include_defined_only: Optional[bool]
    status: Optional[str]
    conclusions: Optional[str]
    path: Optional[str]
