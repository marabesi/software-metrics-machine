from datetime import datetime
import json
from typing import List, Iterable

import pandas as pd
from software_metrics_machine.core.infrastructure.file_system_base_repository import (
    FileSystemBaseRepository,
)
from software_metrics_machine.core.infrastructure.configuration.configuration import (
    Configuration,
)
from software_metrics_machine.core.infrastructure.logger import Logger
from software_metrics_machine.core.pipelines.pipelines_types import (
    DeploymentFrequency,
    PipelineJob,
    PipelineRun,
)


class PipelinesRepository(FileSystemBaseRepository):

    def __init__(self, configuration: Configuration):
        super().__init__(configuration=configuration)
        self.logger = Logger(__name__).get_logger()
        self.pipeline_file = "workflows.json"
        self.jobs_file = "jobs.json"
        self.all_runs: List[PipelineRun] = []
        self.all_jobs: List[PipelineJob] = []

        self.logger.info("Loading runs")

        contents = super().read_file_if_exists(self.pipeline_file)
        if contents is None:
            print(
                f"No workflow file found at {self.pipeline_file}. Please fetch it first."
            )
            return

        self.all_runs = json.loads(contents)
        self.all_runs.sort(key=super().created_at_key_sort)

        print(f"Loaded {len(self.all_runs)} runs")
        print("Load complete.")

        self.__load_jobs()

    def jobs(self, filters=None) -> List[PipelineJob]:
        runs = self.all_jobs
        if not filters:
            return runs

        start_date = filters.get("start_date")
        end_date = filters.get("end_date")

        if start_date and end_date:
            runs = super().filter_by_date_range(self.all_jobs, start_date, end_date)

        name = filters.get("name")
        if name:
            runs = [job for job in self.all_jobs if (job.get("name") or "") == name]

        run_id = filters.get("run_id")
        if run_id:
            runs = [job for job in runs if job.get("run_id") == run_id]

        return runs

    def runs(self, filters=None) -> List[PipelineRun]:
        if not filters:
            return self.all_runs

        runs = self.all_runs

        start_date = filters.get("start_date")
        end_date = filters.get("end_date")

        if start_date and end_date:
            runs = super().filter_by_date_range(runs, start_date, end_date)

        target_branch = filters.get("target_branch")

        if target_branch:

            def branch_matches(obj):
                val = obj.get("head_branch")
                if target_branch == val:
                    return True
                return False

            runs = [r for r in runs if branch_matches(r)]

        event = filters.get("event")
        if event:
            runs = [r for r in runs if (r.get("event") or "") == event]

        workflow_path = filters.get("workflow_path")
        if workflow_path:
            runs = [r for r in runs if (r.get("path") or "").lower() == workflow_path]

        include_defined_only = filters.get("include_defined_only")

        if include_defined_only:
            runs = [r for r in runs if self.__is_defined_yaml(r)]

        status = filters.get("status")
        if status:
            runs = [r for r in runs if r.get("status") == status]

        conclusion = filters.get("conclusion")
        if conclusion:
            runs = [r for r in runs if r.get("conclusion") == conclusion]

        path = filters.get("path")
        if path:
            runs = [r for r in runs if r.get("path") == path]

        return runs

    def filter_by_job_name(
        self, jobs: List[PipelineJob], job_name: Iterable[str]
    ) -> List[PipelineJob]:
        """Return jobs excluding any whose name matches one of the provided job_name values.

        Matching is case-insensitive and uses substring matching: if any provided token
        appears in the job's name, that job is excluded.
        """
        job_name_set = {str(job).strip().lower() for job in (job_name or []) if job}
        if not job_name_set:
            return jobs

        print(f"Excluding jobs: {job_name_set}")
        filtered: List[dict] = []
        for job in jobs:
            pr_job_name = (job.get("name") or "").lower()
            # if any exclusion token appears in the job name, skip it
            if any(token in pr_job_name for token in job_name_set):
                continue
            filtered.append(job)
        return filtered

    def get_unique_workflow_conclusions(self, filters=None) -> List[str]:
        """Return a list of unique workflow conclusions."""
        runs = self.runs(filters)
        conclusions = {run.get("conclusion", "") for run in runs if "conclusion" in run}
        list_all = list(filter(None, list(conclusions)))
        list_all.sort()
        list_all.insert(0, "All")
        return list_all

    def get_unique_workflow_status(self, filters=None) -> List[str]:
        """Return a list of unique workflow status."""
        runs = self.runs(filters)
        conclusions = {run.get("status", "") for run in runs if "status" in run}
        list_all = list(filter(None, list(conclusions)))
        list_all.sort()
        list_all.insert(0, "All")
        return list_all

    def get_unique_workflow_names(self) -> List[str]:
        """Return a list of unique workflow names."""
        workflow_names = {run.get("name", "") for run in self.all_runs if "name" in run}
        return list(workflow_names)

    def get_unique_workflow_paths(self) -> List[str]:
        workflow_names = {run.get("path", "") for run in self.all_runs if "path" in run}
        listWithPaths = list(workflow_names)
        listWithPaths.insert(0, "All")
        return listWithPaths

    def get_unique_jobs_name(self, filters=None) -> List[str]:
        jobs = []
        if filters and filters.get("path"):
            runs = self.runs()
            ids = []

            for run in runs:
                if run["path"] == filters.get("path"):
                    ids.append(run.get("id", None))

            jobs = []
            for id in ids:
                jobs += self.jobs({"run_id": id})
        else:
            jobs = self.jobs()

        job_names = {job.get("name", "") for job in jobs if "name" in job}
        list_all = list(job_names)
        list_all.insert(0, "All")
        return list_all

    def get_deployment_frequency_for_job(
        self, job_name: str, filters=None
    ) -> DeploymentFrequency:
        deployments = {}
        runs = self.runs(filters)

        for run in runs:
            jobs = run.get("jobs", [])
            for job in jobs:
                if job.get("name") == job_name and job.get("conclusion") == "success":
                    created_at = job.get("completed_at")[:10]
                    created_at = datetime.fromisoformat(created_at + "T00:00:00+00:00")
                    day_key = str(created_at.date())
                    week_key = f"{created_at.year}-W{created_at.isocalendar()[1]:02d}"
                    month_key = f"{created_at.year}-{created_at.month:02d}"

                    if day_key not in deployments:
                        deployments[day_key] = {"daily": 0}
                    if week_key not in deployments:
                        deployments[week_key] = {"weekly": 0}
                    if month_key not in deployments:
                        deployments[month_key] = {"weekly": 0, "monthly": 0}

                    deployments[day_key]["daily"] += 1
                    deployments[week_key]["weekly"] += 1
                    deployments[month_key]["monthly"] += 1

        days = sorted([key for key in deployments.keys() if key.count("-") == 2])
        weeks = sorted([key for key in deployments.keys() if "W" in key])
        months = sorted(
            [
                key
                for key in deployments.keys()
                if "W" not in key and key.count("-") == 1
            ]
        )

        daily_counts = [
            deployments[day]["daily"] for day in days if "daily" in deployments[day]
        ]
        weekly_counts = [deployments[week]["weekly"] for week in weeks]
        monthly_counts = [deployments[month]["monthly"] for month in months]

        return {
            "days": days,
            "weeks": weeks,
            "months": months,
            "daily_counts": daily_counts,
            "weekly_counts": weekly_counts,
            "monthly_counts": monthly_counts,
        }

    def get_lead_time_for_job(self, job_name: str, filters=None):
        lead_times = []
        runs = self.runs(filters)

        for run in runs:
            jobs = run.get("jobs", [])
            for job in jobs:
                if job.get("name") == job_name and job.get("conclusion") == "success":
                    created_at = job.get("started_at")
                    completed_at = job.get("completed_at")
                    if created_at and completed_at:
                        start_dt = datetime.fromisoformat(
                            created_at.replace("Z", "+00:00")
                        )
                        end_dt = datetime.fromisoformat(
                            completed_at.replace("Z", "+00:00")
                        )
                        lead_time = (
                            end_dt - start_dt
                        ).total_seconds() / 3600.0  # in hours
                        lead_times.append((start_dt, end_dt, lead_time))

        df = pd.DataFrame(
            lead_times, columns=["start_time", "end_time", "lead_time_hours"]
        )
        if df.empty:
            return {
                "weeks": [],
                "months": [],
                "weekly_avg": [],
                "monthly_avg": [],
            }

        df["week"] = df["start_time"].dt.to_period("W").astype(str)
        df["month"] = df["start_time"].dt.to_period("M").astype(str)

        weekly_avg = df.groupby("week")["lead_time_hours"].mean().reset_index()
        monthly_avg = df.groupby("month")["lead_time_hours"].mean().reset_index()

        weeks = weekly_avg["week"].tolist()
        months = monthly_avg["month"].tolist()
        weekly_avg_values = weekly_avg["lead_time_hours"].tolist()
        monthly_avg_values = monthly_avg["lead_time_hours"].tolist()

        return {
            "weeks": weeks,
            "months": months,
            "weekly_avg": weekly_avg_values,
            "monthly_avg": monthly_avg_values,
        }

    def get_workflows_run_duration(self, filters=None):
        runs = self.runs(filters)
        groups = {}
        for r in runs:
            name = r.get("path") or "<unnamed>"

            start = (
                r.get("run_started_at") or r.get("created_at") or r.get("started_at")
            )
            end = r.get("updated_at")
            sdt = self.__parse_dt(start)
            edt = self.__parse_dt(end)
            if not sdt:
                continue
            if edt:
                dur = (edt - sdt).total_seconds()
            else:
                dur = None
            groups.setdefault(name, []).append(dur)

        if not groups:
            print("No runs with start timestamps to aggregate")
            return {"total": len(runs), "rows": []}

        # compute aggregated metrics per group
        rows = []  # (name, count, avg_min, total_min)
        for name, durs in groups.items():
            # consider only durations that are not None
            valid = [d for d in durs if d is not None and d > 0]
            count = len(durs)
            total = sum(valid) if valid else 0.0
            avg = (total / len(valid)) if valid else 0.0
            rows.append((name, count, avg / 60.0, total / 60.0))

        return {"total": len(runs), "rows": rows}

    def get_pipeline_fails_the_most(self, filters=None):
        runs = self.runs(filters)

        fail_counts = {}
        for run in runs:
            conclusion = run.get("conclusion")
            if conclusion == "failure":
                path = run.get("path")
                fail_counts[path] = fail_counts.get(path, 0) + 1

        sorted_by_key_desc = dict(sorted(fail_counts.items(), reverse=True))

        list_of_fails = []

        for fail_path in sorted_by_key_desc:
            list_of_fails.append(
                {"pipeline_name": fail_path, "failed": fail_counts.get(fail_path)}
            )

        return list_of_fails

    def get_unique_pipeline_trigger_events(self, filters=None) -> List[str]:
        runs = self.runs(filters)
        events = {run.get("event", "") for run in runs if "event" in run}
        list_all = list(filter(None, list(events)))
        list_all.sort()
        list_all.insert(0, "All")
        return list_all

    def __parse_dt(self, v: str):
        if not v:
            return None
        try:
            return datetime.fromisoformat(v.replace("Z", "+00:00"))
        except Exception:
            try:
                return datetime.strptime(v, "%Y-%m-%dT%H:%M:%SZ")
            except Exception:
                return None

    def __load_jobs(self):
        contents = super().read_file_if_exists(self.jobs_file)
        if contents is None:
            print("No jobs file found at jobs.json. Please fetch it first.")
            return

        self.all_jobs = json.loads(contents)
        print(f"Loaded {len(self.all_jobs)} jobs")
        self.all_jobs.sort(key=super().created_at_key_sort)

        run_id_to_run = {run["id"]: run for run in self.all_runs if "id" in run}

        for job in self.all_jobs:
            run_id = job.get("run_id")
            if run_id and run_id in run_id_to_run:
                run = run_id_to_run[run_id]
                if "jobs" not in run:
                    run["jobs"] = []  # Initialize the jobs list if not present
                run["jobs"].append(job)

        print("Jobs have been associated with their corresponding runs.")
        print("Load complete.")

    def __is_defined_yaml(self, run_obj: dict) -> bool:
        path = run_obj.get("path")

        if isinstance(path, str) and (
            path.strip().lower().endswith(".yml")
            or path.strip().lower().endswith(".yaml")
        ):
            return True
        name = run_obj.get("path") or ""
        return isinstance(name, str) and name.strip().lower().endswith(".yml")
