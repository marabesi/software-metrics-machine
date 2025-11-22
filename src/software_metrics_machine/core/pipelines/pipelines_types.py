"""Typed definitions for GitHub workflow runs and jobs used by pipelines_repository.py

This module declares TypedDicts that document the fields accessed across
`providers/github/workflows/pipelines_repository.py` and related viewers.

Two primary types are provided:
- PipelineRun: represents a workflow run (often called "run" or "workflow")
- PipelineJob: represents a job execution attached to a run

A convenience alias `Pipeline` points to PipelineRun for places that expect a
single type name called "Pipeline".
"""

from typing import TypedDict, List, Optional, Union

from pydantic import BaseModel

StrOrInt = Union[str, int]


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

    run_id: int
    name: str
    conclusion: str
    created_at: str
    started_at: str
    completed_at: str
    workflow_name: str
    # workflow: Optional[str]
    # run_name: Optional[str]


class PipelineRun(BaseModel):
    """A workflow run / pipeline entry.

    Common fields used in the codebase:
    - id: run identifier (used to associate jobs)
    - path: workflow file path or key (used to filter by workflow_path)
    - name: human readable workflow name
    - created_at, run_started_at, started_at, updated_at: ISO timestamps
    - event: GitHub event that triggered the run (push, pull_request, ...)
    - head_branch: branch name
    - status / conclusion: status or final conclusion
    - jobs: optional list of PipelineJob items
    """

    id: int
    path: str
    name: str
    created_at: str
    run_started_at: str
    updated_at: str
    event: str
    head_branch: str
    status: str
    conclusion: str
    jobs: List[PipelineJob]


Pipeline = PipelineRun


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
    workflow_paths: Optional[str]
    include_defined_only: Optional[bool]
    status: Optional[str]
    conclusions: Optional[str]
    path: Optional[str]
