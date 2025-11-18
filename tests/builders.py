# flake8: noqa: F601
import json
from typing import Any, List

from software_metrics_machine.core.pipelines.pipelines_types import PipelineRun


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
        {
            "id": 1,
            "path": "/workflows/build.yml",
            "status": "completed",
            "conclusion": "success",
            "created_at": "2023-10-01T12:00:00Z",
        },
    ]


def single_run() -> List[PipelineRun]:
    return [
        {
            "id": 1,
            "path": "/workflows/build.yml",
            "status": "completed",
            "conclusion": "success",
            "created_at": "2023-10-01T12:00:00Z",
        },
    ]


def github_workflows_data() -> List[PipelineRun]:
    return [
        {
            "id": 1,
            "path": "/workflows/tests.yml",
            "status": "success",
            "conclusion": "success",
            "created_at": "2023-10-01T12:00:00Z",
            "run_started_at": "2023-10-01T12:00:00Z",
            "updated_at": "2023-10-01T13:00:00Z",
            "head_branch": "main",
            "event": "push",
        },
        {
            "id": 2,
            "path": "/workflows/build.yml",
            "status": "success",
            "conclusion": "failed",
            "created_at": "2023-10-01T12:00:00Z",
            "run_started_at": "2023-10-01T12:00:00Z",
            "created_at": "2023-10-10T12:00:00Z",
            "updated_at": "2023-10-10T13:00:00Z",
            "head_branch": "master",
            "event": "pull_request",
        },
        {
            "id": 3,
            "path": "dynamic/workflows/dependabot",
            "status": "success",
            "conclusion": "cancelled",
            "created_at": "2024-12-01T12:00:00Z",
            "run_started_at": "2024-12-01T12:00:00Z",
            "updated_at": "2023-12-01T13:00:00Z",
            "head_branch": "master",
            "event": "dependabot",
        },
        {
            "id": 4,
            "path": "dynamic/workflows/dependabot",
            "status": "completed",
            "conclusion": "action_required",
            "created_at": "2025-02-01T12:00:00Z",
            "run_started_at": "2025-02-01T12:00:00Z",
            "updated_at": "2025-02-01T13:00:00Z",
            "head_branch": "master",
            "event": "dependabot",
        },
        {
            "id": 5,
            "path": "dynamic/workflows/dependabot",
            "conclusion": "failed",
            "created_at": "2025-06-01T12:00:00Z",
            "run_started_at": "2025-06-01T12:00:00Z",
            "updated_at": "2025-06-01T13:00:00Z",
            "head_branch": "master",
            "event": "dependabot",
        },
    ]
