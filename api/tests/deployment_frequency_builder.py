from typing import List

from software_metrics_machine.core.pipelines.pipelines_types import (
    DeploymentFrequency,
    DeploymentItem,
)


class DeploymentFrequencyBuilder:
    def __init__(self):
        self._days: List[DeploymentItem] = []
        self._weeks: List[DeploymentItem] = []
        self._months: List[DeploymentItem] = []

    def add_day(
        self, date: str, count: int = 1, commit: str = "", link: str = ""
    ) -> "DeploymentFrequencyBuilder":
        self._days.append(
            DeploymentItem(date=date, count=count, commit=commit, link=link)
        )
        return self

    def add_week(
        self, date: str, count: int = 1, commit: str = "", link: str = ""
    ) -> "DeploymentFrequencyBuilder":
        self._weeks.append(
            DeploymentItem(date=date, count=count, commit=commit, link=link)
        )
        return self

    def add_month(
        self, date: str, count: int = 1, commit: str = "", link: str = ""
    ) -> "DeploymentFrequencyBuilder":
        self._months.append(
            DeploymentItem(date=date, count=count, commit=commit, link=link)
        )
        return self

    def with_days(self, items: List[dict]) -> "DeploymentFrequencyBuilder":
        self._days = [
            DeploymentItem(**it) if not isinstance(it, DeploymentItem) else it
            for it in items
        ]
        return self

    def with_weeks(self, items: List[dict]) -> "DeploymentFrequencyBuilder":
        self._weeks = [
            DeploymentItem(**it) if not isinstance(it, DeploymentItem) else it
            for it in items
        ]
        return self

    def with_months(self, items: List[dict]) -> "DeploymentFrequencyBuilder":
        self._months = [
            DeploymentItem(**it) if not isinstance(it, DeploymentItem) else it
            for it in items
        ]
        return self

    def build(self) -> DeploymentFrequency:
        return DeploymentFrequency(
            days=self._days, weeks=self._weeks, months=self._months
        )


def sample_deployment_frequency() -> DeploymentFrequency:
    return (
        DeploymentFrequencyBuilder()
        .add_day("2023-10-01", count=1, commit="abcdef123")
        .add_week("2023-W39", count=1, commit="abcdef456")
        .add_month("2023-10", count=1, commit="abcdef789")
        .build()
    )
