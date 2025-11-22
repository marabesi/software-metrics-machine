from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import List


@dataclass
class JobRun:
    id: int
    name: str
    conclusion: str
    started_at: str | None
    completed_at: str | None


@dataclass
class PipelineRun:
    id: int
    name: str
    path: str
    conclusion: str
    status: str
    jobs: List[JobRun] = field(default_factory=list)
    run_started_at: str | None = None


class PipelineBuilder:
    def __init__(self, name="CI", path="/.github/workflows/ci.yml", status="completed"):
        self._id = 1
        self._pipeline = PipelineRun(
            id=self._id,
            name=name,
            path=path,
            conclusion="success",
            status=status,
            jobs=[],
            run_started_at=None,
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

    def with_run_started_at(self, started_at: str):
        self._pipeline.run_started_at = started_at
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

    def add_job(
        self,
        name: str | None = None,
        conclusion: str = "success",
        started_at: str | None = None,
        completed_at: str | None = None,
    ):
        self._job_counter += 1
        job = JobRun(
            id=self._job_counter,
            name=name or f"job-{self._job_counter}",
            conclusion=conclusion,
            started_at=started_at,
            completed_at=completed_at,
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
            "id": None,
            "run_id": None,
            "name": "job-1",
            "conclusion": "success",
            "created_at": None,
            "started_at": None,
            "completed_at": None,
            "workflow_path": None,
            "workflow": None,
            "run_name": None,
        }

    def with_run_id(self, run_id: int):
        self._job["run_id"] = run_id
        return self

    def with_id(self, run_id: int):
        self._job["id"] = run_id
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

    def with_workflow_path(self, path: str):
        self._job["workflow_path"] = path
        return self

    def with_run_name(self, run_name: str):
        self._job["run_name"] = run_name
        return self

    def build(self) -> dict:
        # Return a shallow copy to avoid accidental mutation in tests
        return dict(self._job)
