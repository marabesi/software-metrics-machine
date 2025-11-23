from typing import List
from software_metrics_machine.core.pipelines.pipelines_types import (
    PipelineRun,
    PipelineJob,
    PipelineJobStep,
)


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
            completed_at="2023-10-01T12:00:00Z",
            html_url="https://github.com/aaa/json-tool/actions/runs/11",
            jobs=[],
        )
        self._job_counter = 0

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

    def with_name(self, name: str):
        self._pipeline.name = name
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

    def with_jobs(self, jobs: List[PipelineJob]):
        self._pipeline.jobs = jobs
        return self

    def add_job(
        self,
        name: str | None = None,
        conclusion: str = "success",
        run_id: int | None = None,
        started_at: str | None = None,
        finished_at: str | None = None,
        updated_at: str | None = None,
    ):
        job = PipelineJob(
            run_id=run_id,
            name=name,
            conclusion=conclusion,
            started_at=started_at,
            finished_at=finished_at,
            updated_at=updated_at,
            head_branch=self._pipeline.head_branch,
            html_url=self._pipeline.html_url,
        )
        self._pipeline.jobs.append(job)
        return self

    def html_url(self, html_url: str):
        self._pipeline["html_url"] = html_url
        return self

    def build(self) -> PipelineRun:
        return self._pipeline


class PipelineJobBuilder:
    def __init__(self):
        self._job = {
            "id": 1,
            "run_id": 1,
            "name": "job-1",
            "conclusion": "success",
            "status": "completed",
            "created_at": "2023-10-01T12:00:00Z",
            "started_at": "2023-10-01T12:00:00Z",
            "completed_at": "2023-10-01T12:05:00Z",
            "workflow_name": "builder",
            "steps": [],
            "html_url": "https://github.com/aaa/json-tool/actions/runs/11/job/111",
            "head_branch": "main",
            "labels": [],
            "run_attempt": 1,
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

    def with_workflow_name(self, path: str):
        self._job["workflow_name"] = path
        return self

    def with_run_name(self, run_name: str):
        self._job["run_name"] = run_name
        return self

    def with_steps(self, steps: list[dict]):
        self._job["steps"] = steps
        return self

    def html_url(self, html_url: str):
        self._job["html_url"] = html_url
        return self

    def with_status(self, status: str):
        self._job["status"] = status
        return self

    def with_head_branch(self, head_branch: str):
        self._job["head_branch"] = head_branch
        return self

    def with_label(self, label: str):
        self._job["labels"].append(label)
        return self

    def with_html_url(self, html_url: str):
        self._job["html_url"] = html_url
        return self

    def with_run_attempt(self, attempt: int):
        self._job["run_attempt"] = attempt
        return self

    def build(self) -> PipelineJob:
        # Return a shallow copy to avoid accidental mutation in tests
        return PipelineJob(**self._job)


class PipelineJobStepBuilder:
    def __init__(self):
        self._job_step = {
            "number": 1,
            "name": "step-1",
            "conclusion": "success",
            "status": "completed",
            "created_at": "2023-10-01T12:00:00Z",
            "started_at": "2023-10-01T12:00:00Z",
            "completed_at": "2023-10-01T12:05:00Z",
        }

    def with_number(self, number: int):
        self._job_step["number"] = number
        return self

    def with_name(self, name: str):
        self._job_step["name"] = name
        return self

    def with_conclusion(self, conclusion: str):
        self._job_step["conclusion"] = conclusion
        return self

    def with_started_at(self, started_iso: str):
        self._job_step["started_at"] = started_iso
        return self

    def with_completed_at(self, completed_iso: str):
        self._job_step["completed_at"] = completed_iso
        return self

    def with_created_at(self, created_iso: str):
        self._job_step["created_at"] = created_iso
        return self

    def with_status(self, status: str):
        self._job_step["status"] = status
        return self

    def build(self) -> PipelineJobStep:
        return PipelineJobStep(**self._job_step)
