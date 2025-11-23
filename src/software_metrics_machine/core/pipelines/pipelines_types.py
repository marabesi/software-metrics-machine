"""Typed definitions for GitHub workflow runs and jobs used by pipelines_repository.py

This module declares TypedDicts that document the fields accessed across
`providers/github/workflows/pipelines_repository.py` and related viewers.

Two primary types are provided:
- PipelineRun: represents a workflow run (often called "run" or "workflow")
- PipelineJob: represents a job execution attached to a run

A convenience alias `Pipeline` points to PipelineRun for places that expect a
single type name called "Pipeline".
"""

from enum import Enum
from typing import TypedDict, List, Optional, Union

from pydantic import BaseModel

StrOrInt = Union[str, int]


class PipelineJobStepStatus(str, Enum):
    queued = "queued"
    in_progress = "in_progress"
    completed = "completed"


class PipelineJobStep(BaseModel):
    number: int
    name: str
    status: str
    conclusion: Optional[str]
    created_at: str
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
    """A job execution attached to a workflow run.

    Fields are optional (total=False) because the JSON collected from different
    providers or fetchers may omit some fields.

    Common fields used in the codebase:
    - run_id / runId: identifier referencing the parent run
    - name: job name
    - conclusion: outcome such as 'success' or 'failure'
    - created_at / started_at / completed_at: ISO timestamp strings
    - workflow_path, workflow, run_name: optional helpers attached during loading
    """

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
    steps: List[PipelineJobStep]


class PipelineRun(BaseModel):
    id: int
    path: str
    name: Optional[str]
    created_at: str
    run_started_at: str
    updated_at: Optional[str]
    event: str
    head_branch: Optional[str]
    status: Optional[str]
    conclusion: Optional[str]
    jobs: List[PipelineJob]
    html_url: str


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
