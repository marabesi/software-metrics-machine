from software_metrics_machine.core.infrastructure.pandas import pd
import holoviews as hv

from software_metrics_machine.core.infrastructure.base_viewer import (
    BaseViewer,
    PlotResult,
)
from software_metrics_machine.apps.components.barchart_stacked import (
    BarchartStacked,
)
from software_metrics_machine.core.pipelines.aggregates.jobs_average_time_execution import (
    JobsByAverageTimeExecution,
)
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)
from typing import Optional


class ViewJobsByAverageTimeExecution(BaseViewer):

    def __init__(self, repository: PipelinesRepository):
        self.barchart = BarchartStacked(repository=repository)
        self.repository: PipelinesRepository = repository

    def main(
        self,
        top: int = 20,
        workflow_path: Optional[str] = None,
        raw_filters: Optional[str] = None,
        exclude_jobs: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        job_name: Optional[str] = None,
        pipeline_raw_filters: Optional[str] = None,
        metric: str = "avg",
    ) -> PlotResult:
        result = JobsByAverageTimeExecution(repository=self.repository).main(
            top=top,
            workflow_path=workflow_path,
            raw_filters=raw_filters,
            exclude_jobs=exclude_jobs,
            start_date=start_date,
            end_date=end_date,
            job_name=job_name,
            pipeline_raw_filters=pipeline_raw_filters,
            metric=metric,
        )
        averages = result.averages
        runs = result.runs
        jobs = result.jobs
        counts = result.counts
        sums = result.sums
        total_runs = len(runs)
        total_jobs = len(jobs)

        if not averages:
            empty = hv.Text(0, 0, "No job durations found").opts(
                height=super().get_chart_height()
            )
            return PlotResult(
                empty,
                f"Found {total_runs} workflow runs and {total_jobs} jobs after filtering",
            )

        names, mins = zip(*averages)

        x = "job_name"
        y = "minutes"
        count = "count"

        data = []
        for name, val in zip(names, mins):
            data_structure = {x: name, y: val, count: counts.get(name, 0)}
            data.append(data_structure)

        title = (
            f"Top {len(names)} jobs by average duration for {total_runs} runs - {total_jobs} jobs"
            if not workflow_path
            else f"Top {len(names)} jobs by average duration for '{workflow_path}' - {total_runs} runs - {total_jobs} jobs"  # noqa
        )

        chart = self.barchart.build_barchart(
            data,
            x=x,
            y=[y, count],
            stacked=False,
            height=super().get_chart_height(),
            title=title,
            xrotation=0,
            tools=super().get_tools(),
            color=super().get_color(),
        )

        df = pd.DataFrame(averages)

        if metric == "sum":
            df = pd.DataFrame(sums)

        return PlotResult(chart, df)
