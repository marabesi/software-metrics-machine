from datetime import datetime
import pandas as pd

from software_metrics_machine.core.infrastructure.base_viewer import (
    BaseViewer,
    PlotResult,
)
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)


class ViewLeadTime(BaseViewer):
    def __init__(self, repository: PipelinesRepository):
        self.repository = repository

    def plot(
        self,
        workflow_path: str,
        job_name: str,
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> None:
        # Filter jobs by the given job_name
        filtered_jobs = [job for job in self.all_jobs if job.get("name") == job_name]

        # Calculate lead times (time taken for each job to run)
        lead_times = []
        for job in filtered_jobs:
            start_time = datetime.fromisoformat(job.get("start_time"))
            end_time = datetime.fromisoformat(job.get("end_time"))
            lead_times.append(
                (start_time, end_time, (end_time - start_time).total_seconds())
            )

        # Create a DataFrame for lead times
        df = pd.DataFrame(
            lead_times, columns=["start_time", "end_time", "lead_time_seconds"]
        )

        return PlotResult(plot=None, data=df).plot
