import json
from typing import Any
import math


class TypedDictEncoder(json.JSONEncoder):
    """Custom JSON encoder that handles TypedDict objects and NaN/Infinity values"""

    def encode(self, o):
        # Handle special float values at the top level
        if isinstance(o, float) and (math.isnan(o) or math.isinf(o)):
            return 'null'
        return super().encode(o)

    def iterencode(self, o, _one_shot=False):
        """Override iterencode to handle NaN/Infinity in nested structures"""
        def floatstr(o, allow_nan=self.allow_nan,
                     _repr=float.__repr__, _inf=float('inf'),
                     _neginf=-float('inf')):
            if o != o or o == _inf or o == _neginf:
                # NaN or Infinity - return null for JSON
                return 'null'
            else:
                return _repr(o)

        # Temporarily replace allow_nan to handle NaN/Infinity gracefully
        old_floatstr = self._floatstr if hasattr(self, '_floatstr') else None
        self._floatstr = floatstr
        try:
            return super().iterencode(o, _one_shot)
        finally:
            if old_floatstr is not None:
                self._floatstr = old_floatstr

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
