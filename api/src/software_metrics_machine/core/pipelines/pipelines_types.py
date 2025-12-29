from enum import Enum
from typing import List, Optional, Union, Counter
from dataclasses import dataclass, field
from typing_extensions import TypedDict


from pydantic import BaseModel

StrOrInt = Union[str, int]


@dataclass
class PipelineDurationRow:
    name: str
    count: int
    avg_min: float
    total_min: float


@dataclass
class PipelineComputedDurations:
    total: int
    rows: List[PipelineDurationRow]
    runs: List[PipelineRun] = field(default_factory=list)


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


class PipelineRunHeadCommit(TypedDict):
    id: str


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
    conclusion: Optional[str] = "unknown"
    created_at: str
    started_at: Optional[str]
    completed_at: Optional[str]
    workflow_name: str
    html_url: Optional[str]
    head_branch: str
    labels: List[str]
    run_attempt: int
    steps: List[PipelineJobStep] = []
    head_sha: str


class PipelineRun(BaseModel):
    id: int
    path: str
    name: Optional[str] = "unknown"
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
    head_commit: PipelineRunHeadCommit


class DeploymentItem(BaseModel):
    date: str
    count: int
    commit: str
    link: str


class DeploymentFrequency(BaseModel):
    days: List[DeploymentItem]
    weeks: List[DeploymentItem]
    months: List[DeploymentItem]


class PipelineFilters(TypedDict, total=False):
    start_date: Optional[str]
    end_date: Optional[str]
    target_branch: Optional[str]
    event: Optional[str]
    workflow_path: Optional[str]
    include_defined_only: Optional[bool]
    status: Optional[str]
    conclusions: Optional[str]
    job_name: Optional[str]
    path: Optional[str]
    raw_filters: Optional[str]
    job_raw_filters: Optional[str]


@dataclass
class PipelineExecutionDurationResult:
    names: List[str]
    values: List[float]
    job_counts: List[int]
    run_counts: int
    ylabel: str
    title_metric: str
    rows: List[PipelineComputedDurations]
    runs: List[PipelineRun]


@dataclass
class PipelineJobSummaryResult(TypedDict):
    first_job: Optional[PipelineJob]
    last_job: Optional[PipelineJob]
    conclusions: dict[str, int]
    unique_jobs: int
    total_jobs: int
    jobs_by_name: dict[
        str, dict[str, Union[int, Optional[int]]]
    ]  # name -> {count, run_id}


@dataclass
class PipelineByStatusResult:
    status_counts: Counter
    runs: List[PipelineRun]
