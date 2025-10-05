import json
from typing import Any


def as_json_string(object: Any) -> str:
    return json.dumps(object, indent=2)


def workflows_data():
    return [
        {
            "id": 1,
            "path": "/workflows/tests.yml",
            "status": "success",
            "created_at": "2023-10-01T12:00:00Z",
            "head_branch": "main",
            "event": "push",
        },
        {
            "id": 2,
            "path": "/workflows/build.yml",
            "status": "success",
            "created_at": "2023-10-10T12:00:00Z",
            "head_branch": "master",
            "event": "pull_request",
        },
        {
            "id": 3,
            "path": "dynamic/workflows/dependabot",
            "status": "success",
            "created_at": "2024-12-01T12:00:00Z",
            "head_branch": "master",
            "event": "dependabot",
        },
    ]
