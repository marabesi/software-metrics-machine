import json
from typing import Any


def as_json_string(object: Any) -> str:
    return json.dumps(object, indent=2)
