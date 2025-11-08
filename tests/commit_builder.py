from __future__ import annotations

from software_metrics_machine.core.code_types import Commit as CommitTypedDict
import hashlib
import time


class CommitBuilder:
    """Fluent test helper that builds commit-shaped dicts matching
    `core.code_types.Commit`.

    Usage:
        commit = CommitBuilder().with_author("Alice").with_msg("Fix bug").build()

    The builder generates a deterministic-ish hash when not provided using
    the author, message and current time to reduce collisions in tests.
    """

    def __init__(
        self, author: str | None = None, msg: str | None = None, hash: str | None = None
    ) -> None:
        self._author = author or "someone"
        self._msg = msg or "initial commit"
        self._hash = hash
        self.date = None

    def with_author(self, author: str) -> "CommitBuilder":
        self._author = author
        return self

    def with_msg(self, msg: str) -> "CommitBuilder":
        self._msg = msg
        return self

    def with_hash(self, hash_value: str) -> "CommitBuilder":
        self._hash = hash_value
        return self

    def with_date(self, date: str) -> "CommitBuilder":
        self.date = date
        return self

    def _generate_hash(self) -> str:
        # Create a short deterministic hash based on author, msg and time
        seed = f"{self._author}:{self._msg}:{time.time_ns()}"
        return hashlib.sha1(seed.encode("utf-8")).hexdigest()[:12]

    def build(self) -> CommitTypedDict:
        if not self._hash:
            self._hash = self._generate_hash()
        # Return a plain dict matching the TypedDict shape
        return CommitTypedDict(author=self._author, msg=self._msg, hash=self._hash)
