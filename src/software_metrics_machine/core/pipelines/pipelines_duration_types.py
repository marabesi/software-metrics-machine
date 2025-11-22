from dataclasses import dataclass
from typing import List


@dataclass
class PipelineDurationRow:
    name: str
    count: int
    avg_min: float
    total_min: float


@dataclass
class PipelineComputedDurations:
    total: int
    rows: List[PipelineDurationRow]
