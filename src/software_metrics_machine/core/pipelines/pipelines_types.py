"""Typed definitions for GitHub workflow runs and jobs used by pipelines_repository.py

This module declares TypedDicts that document the fields accessed across
`providers/github/workflows/pipelines_repository.py` and related viewers.

Two primary types are provided:
- PipelineRun: represents a workflow run (often called "run" or "workflow")
- PipelineJob: represents a job execution attached to a run

A convenience alias `Pipeline` points to PipelineRun for places that expect a
single type name called "Pipeline".
"""

from typing import TypedDict, List, Optional, Union, Any

StrOrInt = Union[str, int]


class PipelineJob(TypedDict, total=False):
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

    run_id: Optional[StrOrInt]
    runId: Optional[StrOrInt]
    name: Optional[str]
    conclusion: Optional[str]
    created_at: Optional[str]
    started_at: Optional[str]
    completed_at: Optional[str]
    workflow_path: Optional[str]
    workflow: Optional[str]
    run_name: Optional[str]
    # allow other fields to be present
    other: Optional[Any]


class PipelineRun(TypedDict, total=False):
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

    id: Optional[StrOrInt]
    path: Optional[str]
    name: Optional[str]
    created_at: Optional[str]
    run_started_at: Optional[str]
    started_at: Optional[str]
    updated_at: Optional[str]
    event: Optional[str]
    head_branch: Optional[str]
    status: Optional[str]
    conclusion: Optional[str]
    jobs: Optional[List[PipelineJob]]


Pipeline = PipelineRun


class DeploymentFrequency(TypedDict):
    days: List[str]
    weeks: List[str]
    daily_counts: List[str]
    weekly_counts: List[str]
    monthly_counts: List[str]
