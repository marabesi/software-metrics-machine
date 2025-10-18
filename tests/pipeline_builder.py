from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import List


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
    jobs: List[JobRun] = field(default_factory=list)


class PipelineBuilder:
    def __init__(self, name="CI", path="/.github/workflows/ci.yml"):
        self._id = 1
        self._pipeline = PipelineRun(
            id=self._id, name=name, path=path, conclusion="success", jobs=[]
        )
        self._job_counter = 0
        self._base_time = datetime.utcnow()

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
