# flake8: noqa: F601
import json
from typing import Any, List

from software_metrics_machine.core.pipelines.pipelines_types import PipelineRun
from tests.pipeline_builder import (
    PipelineBuilder,
    PipelineJob,
    PipelineJobBuilder,
    PipelineJobStepBuilder,
)


class TypedDictEncoder(json.JSONEncoder):
    """Custom JSON encoder that handles TypedDict objects"""

    def default(self, o):
        # Try to convert to dict if possible
        if hasattr(o, "__dict__"):
            return o.__dict__
        elif hasattr(o, "_asdict"):  # For namedtuples
            return o._asdict()
        # For TypedDict, just convert to regular dict
        return dict(o) if not isinstance(o, (str, int, float, bool, type(None))) else o


def as_json_string(object: Any) -> str:
    # return json.dumps(object, indent=2)
    return json.dumps(object, indent=2, cls=TypedDictEncoder)


def single_deployment_frequency() -> List[PipelineRun]:
    return [
        PipelineBuilder()
        .with_id(1)
        .with_path("/workflows/build.yml")
        .with_status("completed")
        .with_conclusion("success")
        .with_created_at("2023-10-01T12:00:00Z")
        .with_run_started_at("2023-10-01T12:01:00Z")
        .with_updated_at("2023-10-01T12:10:00Z")
        .with_event("push")
        .with_head_branch("main")
        .with_jobs([])
        .with_html_url("http://link-to-pipeline")
        .build(),
    ]


def single_run() -> List[PipelineRun]:
    return [
        PipelineBuilder()
        .with_id(1)
        .with_path("/workflows/build.yml")
        .with_status("completed")
        .with_conclusion("success")
        .with_created_at("2023-10-01T12:00:00Z")
        .with_run_started_at("2023-10-01T12:01:00Z")
        .with_updated_at("2023-10-01T12:10:00Z")
        .with_event("push")
        .with_head_branch("main")
        .with_jobs([])
        .build(),
    ]


def github_workflows_data() -> List[PipelineRun]:
    return [
        PipelineBuilder()
        .with_id(1)
        .with_path("/workflows/tests.yml")
        .with_status("completed")
        .with_conclusion("success")
        .with_created_at("2023-10-01T12:00:00Z")
        .with_run_started_at("2023-10-01T12:01:00Z")
        .with_updated_at("2023-10-01T12:10:00Z")
        .with_event("push")
        .with_head_branch("main")
        .build(),
        PipelineBuilder()
        .with_id(2)
        .with_path("/workflows/build.yml")
        .with_status("completed")
        .with_conclusion("success")
        .with_created_at("2023-10-01T12:00:00Z")
        .with_run_started_at("2023-10-01T12:00:00Z")
        .with_updated_at("2023-10-10T13:00:00Z")
        .with_event("pull_request")
        .with_head_branch("master")
        .build(),
        PipelineBuilder()
        .with_id(3)
        .with_path("dynamic/workflows/dependabot")
        .with_status("completed")
        .with_conclusion("success")
        .with_created_at("2023-10-01T12:00:00Z")
        .with_run_started_at("2023-10-01T12:00:00Z")
        .with_updated_at("2023-10-01T13:00:00Z")
        .with_head_branch("master")
        .with_event("dependabot")
        .build(),
        PipelineBuilder()
        .with_id(4)
        .with_path("dynamic/workflows/dependabot")
        .with_status("completed")
        .with_conclusion("action_required")
        .with_created_at("2025-02-01T12:00:00Z")
        .with_run_started_at("2025-02-01T12:00:00Z")
        .with_updated_at("2025-02-01T13:00:00Z")
        .with_head_branch("master")
        .with_event("dependabot")
        .build(),
        PipelineBuilder()
        .with_id(5)
        .with_path("dynamic/workflows/dependabot")
        .with_status("failed")
        .with_conclusion("failure")
        .with_created_at("2025-06-01T12:00:00Z")
        .with_run_started_at("2025-06-01T12:00:00Z")
        .with_updated_at("2025-06-01T13:00:00Z")
        .with_head_branch("master")
        .with_event("dependabot")
        .build(),
    ]


def mocked_read_file_if_exists(
    file, workflows: List[PipelineRun] = [], jobs: List[PipelineJob] = []
):
    if file == "workflows.json":
        return as_json_string(workflows)
    if file == "jobs.json":
        return as_json_string(jobs)
    raise FileNotFoundError(f"File {file} not found - tests.builders.builder.py")


job_with_single_step_completed_successfully = [
    PipelineJobBuilder()
    .with_id(1)
    .with_run_id(1)
    .with_steps(
        [
            PipelineJobStepBuilder()
            .with_number(1)
            .with_name("Set up job")
            .with_status("completed")
            .with_conclusion("success")
            .with_created_at("2025-09-01T00:37:47Z")
            .with_started_at("2025-09-01T00:37:47Z")
            .with_completed_at("2025-09-01T00:37:48Z")
            .build()
        ]
    )
    .with_workflow_name("Node CI")
    .with_head_branch("main")
    .with_run_attempt(1)
    .with_html_url("https://github.com/marabesi/json-tool/actions/runs/17364448040")
    .with_status("completed")
    .with_conclusion("success")
    .with_name("build")
    .build(),
]
