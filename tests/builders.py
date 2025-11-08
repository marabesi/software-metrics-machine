# flake8: noqa: F601
import json
from typing import Any


def as_json_string(object: Any) -> str:
    return json.dumps(object, indent=2)


def single_deployment_frequency():
    return [
        {
            "id": 1,
            "path": "/workflows/build.yml",
            "status": "success",
            "created_at": "2023-10-01T12:00:00Z",
        },
    ]


def single_run():
    return [
        {
            "id": 1,
            "path": "/workflows/build.yml",
            "status": "success",
            "created_at": "2023-10-01T12:00:00Z",
        },
    ]


def github_workflows_data():
    return [
        {
            "id": 1,
            "path": "/workflows/tests.yml",
            "status": "success",
            "conclusion": "success",
            "created_at": "2023-10-01T12:00:00Z",
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
            "updated_at": "2025-02-01T13:00:00Z",
            "head_branch": "master",
            "event": "dependabot",
        },
        {
            "id": 5,
            "path": "dynamic/workflows/dependabot",
            "conclusion": "failed",
            "created_at": "2025-06-01T12:00:00Z",
            "updated_at": "2025-06-01T13:00:00Z",
            "head_branch": "master",
            "event": "dependabot",
        },
    ]
