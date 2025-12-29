import json
from typing import Any


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
