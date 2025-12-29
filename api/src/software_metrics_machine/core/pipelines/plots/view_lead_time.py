from datetime import datetime
from software_metrics_machine.core.infrastructure.pandas import pd

from software_metrics_machine.core.infrastructure.base_viewer import (
    BaseViewer,
    PlotResult,
)
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)
from software_metrics_machine.core.pipelines.pipelines_types import PipelineFilters
from software_metrics_machine.providers.pydriller.commit_traverser import (
    CommitTraverser,
)
from typing import List, Tuple, Set


class ViewLeadTime(BaseViewer):
    def __init__(self, repository: PipelinesRepository):
        self.pipeline_repository = repository
        self.traverser = CommitTraverser(
            configuration=self.pipeline_repository.configuration
        )

    def main(
        self,
        workflow_path: str,
        job_name: str,
        start_date: str | None = None,
        end_date: str | None = None,
        pipeline_raw_filters: str | None = None,
        job_raw_filters: str | None = None,
    ) -> PlotResult[pd.DataFrame]:
        filters = PipelineFilters(
            **{
                "status": "completed",
                "conclusions": "success",
                "workflow_path": workflow_path,
                "start_date": start_date,
                "end_date": end_date,
                "job_name": job_name,
                "raw_filters": pipeline_raw_filters,
                "job_raw_filters": job_raw_filters,
            }
        )

        runs = self.pipeline_repository.runs(filters)
        lead_rows: List[Tuple[str, datetime, datetime, float]] = []
        deploy_candidates: Set[Tuple[str, datetime]] = set()

        for run in runs:
            jobs = run.jobs

            for job in jobs:
                completed_at = job.completed_at
                if not completed_at:
                    continue
                if job.status != "completed" or job.conclusion != "success":
                    continue
                deploy_dt = datetime.fromisoformat(completed_at.replace("Z", "+00:00"))
                sha = job.head_sha
                deploy_candidates.add((sha, deploy_dt))

        for sha, deploy_dt in deploy_candidates:
            commit_dt = self.find_release_for_commit(runs, sha)
            if commit_dt:
                lead_hours = (deploy_dt - commit_dt).total_seconds() / 3600.0
                lead_rows.append((sha, commit_dt, deploy_dt, lead_hours))

        if len(lead_rows) == 0:
            return PlotResult(plot=None, data=pd.DataFrame([]))

        df = pd.DataFrame(
            lead_rows, columns=["commit", "start_time", "end_time", "lead_time_hours"]
        )

        if df.empty:
            return PlotResult(plot=None, data=df)

        df["start_time"] = (
            pd.to_datetime(df["start_time"])
            if not pd.api.types.is_datetime64_any_dtype(df["start_time"])
            else df["start_time"]
        )
        df["week"] = df["start_time"].dt.to_period("W").astype(str)
        df["month"] = df["start_time"].dt.to_period("M").astype(str)

        # weekly_avg = df.groupby("week")["lead_time_hours"].mean().reset_index()
        # monthly_avg = df.groupby("month")["lead_time_hours"].mean().reset_index()

        return PlotResult(
            plot=None,
            # "weeks": weekly_avg["week"].tolist(),
            # "months": monthly_avg["month"].tolist(),
            # "weekly_avg": weekly_avg["lead_time_hours"].tolist(),
            # "monthly_avg": monthly_avg["lead_time_hours"].tolist(),
            data=df,
        )

    def find_release_for_commit(self, runs, commit_hash):
        for run in runs:  # or repository.all_runs
            if run.head_commit["id"] and run.head_commit["id"].startswith(commit_hash):
                return datetime.fromisoformat(run.run_started_at.replace("Z", "+00:00"))
            for job in run.jobs:
                if job.head_sha and job.head_sha.startswith(commit_hash):
                    return datetime.fromisoformat(
                        job.completed_at.replace("Z", "+00:00")
                    )
        return None
