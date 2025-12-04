from dataclasses import dataclass, field
from typing import List

from software_metrics_machine.core.pipelines.pipelines_types import PipelineRun


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
    runs: List[PipelineRun] = field(default_factory=list)
