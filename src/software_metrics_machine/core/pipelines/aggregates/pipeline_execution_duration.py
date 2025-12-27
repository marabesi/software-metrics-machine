from typing import List
from datetime import datetime, timedelta
from software_metrics_machine.core.infrastructure.base_viewer import BaseViewer
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)
from software_metrics_machine.core.pipelines.pipelines_types import (
    PipelineExecutionDurationResult,
    PipelineFilters,
    PipelineRun,
    PipelineComputedDurations,
)


class PipelineExecutionDuration(BaseViewer):
    def __init__(self, repository: PipelinesRepository):
        self.repository: PipelinesRepository = repository

    def main(
        self,
        workflow_path: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
        max_runs: int = 50,
        metric: str = "avg",
        sort_by: str = "avg",
        raw_filters: str | None = None,
        aggregate_by_day: bool = False,
    ) -> PipelineExecutionDurationResult:
        filters = PipelineFilters(
            **{
                "start_date": start_date,
                "end_date": end_date,
                "workflow_path": workflow_path,
                "raw_filters": raw_filters,
            }
        )

        if aggregate_by_day:
            return self.__aggregate_by_day(start_date, end_date, filters, metric)

        data = self.repository.get_workflows_run_duration(filters)
        rows = data.rows
        run_count = data.total

        sort_key = {
            "avg": lambda r: r[2],
            "sum": lambda r: r[3],
            "count": lambda r: r[1],
        }.get(sort_by, lambda r: r[2])

        rows.sort(key=sort_key, reverse=True)
        rows_limited = rows[:max_runs]

        names = [r[0] for r in rows_limited]  # type: ignore
        counts = [r[1] for r in rows_limited]  # type: ignore
        avgs = [r[2] for r in rows_limited]  # type: ignore
        sums = [r[3] for r in rows_limited]  # type: ignore

        rows_computed: List[PipelineComputedDurations] = []

        for row in rows_limited:
            rows_computed.append(
                PipelineComputedDurations(
                    total=row.count,
                    rows=rows,
                    runs=data.runs,
                )
            )

        if metric == "sum":
            values = sums
            ylabel = "Total minutes"
            title_metric = "Total"
        elif metric == "count":
            values = counts
            ylabel = "Count"
            title_metric = "Count"
        else:
            values = avgs
            ylabel = "Average minutes"
            title_metric = "Average"

        return PipelineExecutionDurationResult(
            names=names,
            values=values,
            job_counts=counts,
            ylabel=ylabel,
            title_metric=title_metric,
            rows=rows_computed,
            run_counts=run_count,
            runs=data.runs,
        )

    def __aggregate_by_day(
        self,
        start_date: str | None,
        end_date: str | None,
        filters: PipelineFilters,
        metric: str,
    ) -> PipelineExecutionDurationResult:
        if not start_date or not end_date:
            return PipelineExecutionDurationResult(
                names=[],
                values=[],
                job_counts=[],
                ylabel="",
                title_metric="",
                rows=[],
                run_counts=0,
                runs=[],
            )

        try:
            sd = datetime.fromisoformat(start_date).date()
            ed = datetime.fromisoformat(end_date).date()
        except Exception:
            return PipelineExecutionDurationResult(
                names=[],
                values=[],
                job_counts=[],
                ylabel="",
                title_metric="",
                rows=[],
                run_counts=0,
                runs=[],
            )

        days = []
        cur = sd
        while cur <= ed:
            days.append(str(cur))
            cur = cur + timedelta(days=1)

        names: List[str] = []
        values: List[float] = []
        counts: List[int] = []
        rows_per_day: List[PipelineComputedDurations] = []
        runs: List[PipelineRun] = []

        for day in days:
            day_filters = PipelineFilters(
                **{**filters, "start_date": day, "end_date": day}
            )
            data = self.repository.get_workflows_run_duration(day_filters)
            run_count = data.total
            rows_day = data.rows

            # compute aggregates across all pipelines for the day
            total_minutes = sum([r[3] for r in rows_day]) if rows_day else 0.0  # type: ignore
            total_counts = sum([r[1] for r in rows_day]) if rows_day else 0  # type: ignore
            # approximate average across day: total_minutes / max(1, total_counts)
            avg_minutes = (total_minutes / total_counts) if total_counts else 0.0

            if metric == "sum":
                metric_value = total_minutes
                ylabel = "Total minutes"
                title_metric = "Total"
            elif metric == "count":
                metric_value = total_counts
                ylabel = "Count"
                title_metric = "Count"
            else:
                metric_value = avg_minutes
                ylabel = "Average minutes"
                title_metric = "Average"

            names.append(day)
            values.append(metric_value)
            counts.append(total_counts)
            runs.extend(data.runs)
            rows_per_day.append(
                PipelineComputedDurations(
                    total=len(rows_day),
                    rows=rows_day,
                    runs=data.runs,
                )
            )

        return PipelineExecutionDurationResult(
            names=names,
            values=values,
            job_counts=counts,
            ylabel=ylabel,
            title_metric=title_metric,
            rows=rows_per_day,
            run_counts=run_count,
            runs=runs,
        )
