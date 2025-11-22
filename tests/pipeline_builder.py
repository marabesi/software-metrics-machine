from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import List
from software_metrics_machine.core.pipelines.pipelines_types import PipelineJob


@dataclass
class JobRun:
    id: int
    name: str
    conclusion: str
    started_at: datetime
    finished_at: datetime


@dataclass
class PipelineRun:
    id: int
    name: str
    path: str
    conclusion: str
    status: str
    event: str
    head_branch: str
    run_started_at: str
    created_at: str
    updated_at: str
    jobs: List[JobRun] = field(default_factory=list)


class PipelineBuilder:
    def __init__(self, name="CI", path="/.github/workflows/ci.yml", status="completed"):
        self._id = 1
        self._pipeline = PipelineRun(
            id=self._id,
            name=name,
            path=path,
            conclusion="success",
            status=status,
            event="push",
            head_branch="main",
            run_started_at="2023-10-01T12:00:00Z",
            created_at="2023-10-01T12:00:00Z",
            updated_at="2023-10-01T12:00:00Z",
            jobs=[],
        )
        self._job_counter = 0
        self._base_time = datetime.now(tz=timezone.utc)

    def with_id(self, id: int):
        self._pipeline.id = id
        return self

    def with_created_at(self, created_at: str):
        self._pipeline.created_at = created_at
        return self

    def with_updated_at(self, updated_at: str):
        self._pipeline.updated_at = updated_at
        return self

    def with_conclusion(self, conclusion: str):
        self._pipeline.conclusion = conclusion
        return self

    def with_status(self, status: str):
        self._pipeline.status = status
        return self

    def with_path(self, status: str):
        self._pipeline.path = status
        return self

    def with_run_started_at(self, run_started_at: str):
        self._pipeline.run_started_at = run_started_at
        return self

    def with_head_branch(self, head_branch: str):
        self._pipeline.head_branch = head_branch
        return self

    def with_event(self, event: str):
        self._pipeline.event = event
        return self

    def with_jobs(self, jobs: List[JobRun]):
        self._pipeline.jobs = jobs
        return self

    def add_job(
        self,
        name: str | None = None,
        conclusion: str = "success",
        duration_minutes: int = 1,
    ):
        self._job_counter += 1
        start = self._base_time + timedelta(minutes=self._job_counter * 5)
        job = JobRun(
            id=self._job_counter,
            name=name or f"job-{self._job_counter}",
            conclusion=conclusion,
            started_at=start,
            finished_at=start + timedelta(minutes=duration_minutes),
        )
        self._pipeline.jobs.append(job)
        return self

    def build(self) -> PipelineRun:
        return self._pipeline


class PipelineJobBuilder:
    """Test helper to build job dicts compatible with `PipelineJob` TypedDict.

    Usage:
        job = PipelineJobBuilder().with_id(1).with_name("test").build()
    """

    def __init__(self):
        self._job = {
            "id": 1,
            "run_id": 1,
            "name": "job-1",
            "conclusion": "success",
            "created_at": "2023-10-01T12:00:00Z",
            "started_at": "2023-10-01T12:00:00Z",
            "completed_at": "2023-10-01T12:05:00Z",
            # "workflow_path": "",
            "workflow_name": "",
            "steps": [],
        }

    def with_run_id(self, run_id: int):
        self._job["run_id"] = run_id
        return self

    def with_id(self, id: int):
        self._job["id"] = id
        return self

    def with_name(self, name: str):
        self._job["name"] = name
        return self

    def with_conclusion(self, conclusion: str):
        self._job["conclusion"] = conclusion
        return self

    def with_started_at(self, started_iso: str):
        self._job["started_at"] = started_iso
        return self

    def with_completed_at(self, completed_iso: str):
        self._job["completed_at"] = completed_iso
        return self

    def with_created_at(self, created_iso: str):
        self._job["created_at"] = created_iso
        return self

    def with_workflow_path(self, path: str):
        self._job["workflow_path"] = path
        return self

    def with_run_name(self, run_name: str):
        self._job["run_name"] = run_name
        return self

    def with_steps(self, steps: list[dict]):
        self._job["steps"] = steps
        return self

    def build(self) -> PipelineJob:
        # Return a shallow copy to avoid accidental mutation in tests
        return PipelineJob(**self._job)
