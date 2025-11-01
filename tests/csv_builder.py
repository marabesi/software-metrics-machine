from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Iterable


@dataclass
class CSVBuilder:
    """A small builder for test CSV files.

    Usage:
        builder = CSVBuilder()
        builder.add_row(["a","b",1,2]).add_row(["c","d",3,4])
        csv_text = builder.build()
        builder.write_to("/tmp/my.csv")
    """

    headers: List[str] = field(
        default_factory=lambda: ["entity", "coupled", "degree", "average-revs"]
    )
    rows: List[List[str]] = field(default_factory=list)

    def add_row(self, row: Iterable) -> "CSVBuilder":
        self.rows.append([str(x) for x in row])
        return self

    def extend_rows(self, rows: Iterable[Iterable]) -> "CSVBuilder":
        for r in rows:
            self.add_row(r)
        return self

    def build(self) -> str:
        parts = [",".join(self.headers)]
        for r in self.rows:
            parts.append(",".join(r))
        return "\n".join(parts) + "\n"

    def write_to(self, path: str, encoding: str = "utf-8") -> None:
        text = self.build()
        with open(path, "w", encoding=encoding) as f:
            f.write(text)


def sample_csv_builder() -> CSVBuilder:
    """Return a builder pre-populated with the repository's sample CSV content."""
    b = CSVBuilder()
    b.extend_rows(
        [
            ["another.txt", "aaaa.mp3", 10, 2],
            ["file.ts", "brum.ts", 10, 2],
        ]
    )
    return b


def sample_csv() -> str:
    """Convenience function returning the original sample CSV text."""
    return sample_csv_builder().build()
