from datetime import datetime
from typing import List, Iterable, Optional

from software_metrics_machine.core.infrastructure.pandas import pd
from pydantic import TypeAdapter
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
    PipelineJobConclusion,
    PipelineRun,
    PipelineFilters,
    PipelineComputedDurations,
    PipelineDurationRow,
)


class PipelinesRepository(FileSystemBaseRepository):

    def __init__(self, configuration: Configuration):
        super().__init__(configuration=configuration, target_subfolder="github")
        self.logger = Logger(configuration=configuration).get_logger()
        self.pipeline_file = "workflows.json"
        self.jobs_file = "jobs.json"
        self.all_runs: List[PipelineRun] = []
        self.all_jobs: List[PipelineJob] = []

        self.logger.debug("Loading runs")
        self.__load_runs()
        self.logger.debug(f"Loaded {len(self.all_runs)} runs")

        self.__load_jobs()
        self.__compute_duration_for_pipelines()
        self.__compute_short_name_for_pipelines()

    def __compute_short_name_for_pipelines(self):
        """
        Compute and attach short names for each PipelineRun based on the workflow path.

        The short name is derived from the workflow file name without its extension.
        """
        for run in self.all_runs:
            path = run.path
            if isinstance(path, str):
                short_name = path.split("/")[-1].rsplit(".", 1)[0]
                setattr(run, "short_name", short_name)
            else:
                setattr(run, "short_name", None)

    def __compute_duration_for_pipelines(self):
        """
        Compute and attach per-run job durations (in minutes) on each PipelineRun.

        Optimizations for large datasets:
        - Build a lookup map from run id -> run to avoid O(N^2) searches.
        - Minimize attribute lookups inside hot loops.
        - Accumulate durations in a dict of lists and then attach them in a second pass.
        """
        if not self.all_runs:
            return

        # prepare fast-access locals
        run_map = {r.id: r for r in self.all_runs}
        parse_dt = self.__parse_dt
        log_warning = self.logger.warning

        groups: dict[str, float] = {}

        # iterate runs and jobs once, accumulating durations per run id
        for run in self.all_runs:
            rid = run.id
            jobs = getattr(run, "jobs", [])
            groups[rid] = 0.0
            for job in jobs:
                if job.conclusion == "skipped":
                    continue
                if job.started_at is None:
                    continue
                if job.completed_at is None:
                    continue

                sdt = parse_dt(job.started_at)
                edt = parse_dt(job.completed_at)
                if edt:
                    # store minutes to match other code expectations
                    dur_min = (edt - sdt).total_seconds() / 60.0
                    groups[rid] = groups[rid] + dur_min
                else:
                    log_warning(
                        f"No completed_at for job {getattr(job, 'id', '<unknown>')}"
                    )

        # attach computed durations back to corresponding run objects
        if groups:
            for rid, durs in groups.items():
                run = run_map.get(rid)
                if run is not None:
                    # attach list of durations in minutes
                    setattr(run, "duration_in_minutes", durs)

    def jobs(self, filters=None) -> List[PipelineJob]:
        jobs = self.all_jobs
        if not filters:
            return jobs

        raw_filters = filters.get("raw_filters")
        if raw_filters:
            parsed = super().parse_raw_filters(raw_filters)
            self.logger.debug(f"Applying job filter: {parsed}")
            filters = {**filters, **parsed}

        start_date = filters.get("start_date")
        end_date = filters.get("end_date")

        if start_date and end_date:
            jobs = super().filter_by_date_range(self.all_jobs, start_date, end_date)

        name = filters.get("name")
        if name:
            jobs = [job for job in jobs if job.name == name]

        pipeline = filters.get("pipeline")
        if pipeline:
            jobs = [job for job in jobs if job.workflow_name == pipeline]

        run_id = filters.get("run_id")
        if run_id:
            jobs = [job for job in jobs if job.run_id == run_id]

        status = filters.get("status")
        if status:
            jobs = [job for job in jobs if job.status == status]

        include_jobs_with_pipelines_only = filters.get(
            "include_jobs_with_pipelines_only"
        )
        if not include_jobs_with_pipelines_only:
            run_ids = {r.id for r in self.all_runs if r.id is not None}
            jobs = [j for j in jobs if j.run_id in run_ids]

        exclude_jobs = filters.get("exclude_jobs")
        if exclude_jobs:
            exclude = [s.strip() for s in exclude_jobs.split(",") if s.strip()]
            jobs = self.filter_by_job_name(jobs, exclude)

        return jobs

    def runs(self, filters: PipelineFilters | None = None) -> List[PipelineRun]:
        if not filters:
            return self.all_runs

        raw_filters = filters.get("raw_filters")
        if raw_filters:
            parsed = super().parse_raw_filters(raw_filters)
            self.logger.debug(f"Applying pipeline filter: {parsed}")
            filters = {**filters, **parsed}

        runs = self.all_runs

        start_date = filters.get("start_date")
        end_date = filters.get("end_date")

        if start_date and end_date:
            runs = super().filter_by_date_range(runs, start_date, end_date)

        target_branch = filters.get("target_branch")

        if target_branch:

            def branch_matches(obj: PipelineRun):
                if target_branch == obj.head_branch:
                    return True
                return False

            runs = [r for r in runs if branch_matches(r)]

        event = filters.get("event")
        if event:
            runs = [r for r in runs if r.event == event]

        workflow_path = filters.get("workflow_path")
        if workflow_path:
            runs = [r for r in runs if r.path == workflow_path]

        include_defined_only = filters.get("include_defined_only")

        if include_defined_only:
            runs = [r for r in runs if self.__is_defined_yaml(r)]

        status = filters.get("status")
        if status:
            runs = [r for r in runs if r.status == status]

        conclusion = filters.get("conclusion")
        if conclusion:
            runs = [r for r in runs if r.conclusion == conclusion]

        path = filters.get("path")
        if path:
            runs = [r for r in runs if r.path == path]

        job_name = filters.get("job_name")
        if job_name:
            runs = [
                run for run in runs if any(job.name == job_name for job in run.jobs)
            ]

        job_raw_filters = filters.get("job_raw_filters")
        if job_name:
            job_filters_parsed = super().parse_raw_filters(job_raw_filters)

            for filter_key, filter_value in job_filters_parsed.items():

                def job_matches(obj: PipelineJob):
                    attr_value = getattr(obj, filter_key, None)
                    if attr_value is None:
                        return False
                    if str(attr_value) == str(filter_value):
                        return True
                    return False

                runs = [
                    run for run in runs if any(job_matches(job) for job in run.jobs)
                ]

        return runs

    def filter_by_job_name(
        self, jobs: List[PipelineJob], job_name: Iterable[str]
    ) -> List[PipelineJob]:
        job_name_set = {str(job) for job in (job_name or []) if job}
        if not job_name_set:
            return jobs

        filtered: List[PipelineJob] = []
        for job in jobs:
            pr_job_name = job.name
            if any(token in pr_job_name for token in job_name_set):
                continue
            filtered.append(job)
        return filtered

    def get_unique_workflow_conclusions(self, filters=None) -> List[str]:
        runs = self.runs(filters)
        conclusions = {run.conclusion for run in runs}
        list_all = list(filter(None, list(conclusions)))
        list_all.sort()
        list_all.insert(0, "All")
        return list_all

    def get_unique_workflow_status(self, filters=None) -> List[str]:
        runs = self.runs(filters)
        conclusions = {run.status for run in runs}
        list_all = list(filter(None, list(conclusions)))
        list_all.sort()
        list_all.insert(0, "All")
        return list_all

    def get_unique_workflow_names(self) -> List[str]:
        workflow_names = {run.name for run in self.all_runs}
        return list(workflow_names)  # type: ignore

    def get_unique_workflow_paths(
        self, filters: Optional[PipelineFilters] = None
    ) -> List[str]:
        runs = self.runs(filters)
        workflow_names = {run.path for run in runs}
        listWithPaths = list(workflow_names)
        listWithPaths.insert(0, "All")
        return listWithPaths

    def get_unique_jobs_name(self, filters=None) -> List[str]:
        jobs: List[PipelineJob] = []
        if filters and filters.get("path"):
            runs = self.runs()
            ids = []

            for run in runs:
                if run.path == filters.get("path"):
                    ids.append(run.id)

            jobs = []
            for id in ids:
                jobs += self.jobs({"run_id": id})
        else:
            jobs = self.jobs()

        job_names = {job.name for job in jobs}
        list_all = list(job_names)
        list_all.insert(0, "All")
        return list_all

    def get_deployment_frequency_for_job(
        self, job_name: str, filters: Optional[PipelineFilters]
    ) -> DeploymentFrequency:
        deployments = {}
        runs = self.runs(filters)

        for run in runs:
            for job in run.jobs:
                if (
                    job.name == job_name
                    and job.conclusion == PipelineJobConclusion.success
                    and job.completed_at is not None
                ):
                    raw_created_at = job.completed_at[:10]
                    created_at = datetime.fromisoformat(
                        raw_created_at + "T00:00:00+00:00"
                    )
                    day_key = str(created_at.date())
                    week_key = f"{created_at.year}-W{created_at.isocalendar()[1]:02d}"
                    month_key = f"{created_at.year}-{created_at.month:02d}"
                    commit_id = run.head_commit["id"]

                    if day_key not in deployments:
                        deployments[day_key] = {
                            "daily": 0,
                            "commit": commit_id,
                            "link": run.html_url,
                        }
                    if week_key not in deployments:
                        deployments[week_key] = {
                            "weekly": 0,
                            "commit": commit_id,
                            "link": run.html_url,
                        }
                    if month_key not in deployments:
                        deployments[month_key] = {
                            "weekly": 0,
                            "monthly": 0,
                            "commit": commit_id,
                            "link": run.html_url,
                        }

                    deployments[day_key]["daily"] += 1  # type: ignore
                    deployments[week_key]["weekly"] += 1  # type: ignore
                    deployments[month_key]["monthly"] += 1  # type: ignore

        days = sorted([key for key in deployments.keys() if key.count("-") == 2])
        weeks = sorted([key for key in deployments.keys() if "W" in key])
        months = sorted(
            [
                key
                for key in deployments.keys()
                if "W" not in key and key.count("-") == 1
            ]
        )

        days_items = [
            {
                "date": day,
                "count": deployments[day].get("daily", 0),
                "commit": deployments[day].get("commit", ""),
                "link": deployments[day].get("link", ""),
            }
            for day in days
        ]
        weeks_items = [
            {
                "date": week,
                "count": deployments[week].get("weekly", 0),
                "commit": deployments[week].get("commit", ""),
                "link": deployments[week].get("link", ""),
            }
            for week in weeks
        ]
        months_items = [
            {
                "date": month,
                "count": deployments[month].get("monthly", 0),
                "commit": deployments[month].get("commit", ""),
                "link": deployments[month].get("link", ""),
            }
            for month in months
        ]

        return DeploymentFrequency(
            **{  # type: ignore
                "days": days_items,
                "weeks": weeks_items,
                "months": months_items,
            }
        )

    def get_lead_time_for_job(self, job_name: str, filters=None):
        lead_times = []
        runs = self.runs(filters)

        for run in runs:
            jobs = run.jobs
            for job in jobs:
                if job.name == job_name and job.conclusion == "success":
                    created_at = job.started_at
                    completed_at = job.completed_at
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

    def get_workflows_run_duration(
        self, filters: Optional[PipelineFilters] = None
    ) -> PipelineComputedDurations:
        runs = self.runs(filters)
        total_runs = len(runs)
        groups: dict[str, List[float]] = {}

        for run in runs:
            name = run.path
            for job in run.jobs:
                if job.conclusion == "skipped":
                    continue
                start = job.started_at
                if start is None:
                    continue

                end = job.completed_at
                if end is None:
                    continue

                sdt = self.__parse_dt(start)
                edt = self.__parse_dt(end)
                if edt:
                    dur = (edt - sdt).total_seconds()
                    name = run.path
                    groups.setdefault(name, []).append(dur)
                else:
                    self.logger.warning(f"No completed_at for job {job.id}")

        if not groups:
            return PipelineComputedDurations(total_runs, [], [])

        rows_struct: List[PipelineDurationRow] = []
        for name, durs in groups.items():
            # consider only durations that are not None
            valid = [d for d in durs if d is not None and d > 0]
            jobs_count = len(durs)
            total = sum(valid) if valid else 0.0
            avg = (total / len(valid)) if valid else 0.0
            rows_struct.append(
                PipelineDurationRow(
                    name=name,
                    count=jobs_count,
                    avg_min=avg / 60.0,
                    total_min=total / 60.0,
                )
            )

        rows: List[PipelineDurationRow] = [
            (r.name, r.count, r.avg_min, r.total_min) for r in rows_struct  # type: ignore
        ]

        return PipelineComputedDurations(total=total_runs, rows=rows, runs=runs)

    def get_pipeline_fails_the_most(self, filters=None):
        runs = self.runs(filters)

        fail_counts = {}
        for run in runs:
            conclusion = run.conclusion
            if conclusion == "failure":
                path = run.path
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
        events = {run.event for run in runs}
        list_all = list(filter(None, list(events)))
        list_all.sort()
        list_all.insert(0, "All")
        return list_all

    def __parse_dt(self, v: str) -> datetime:
        return datetime.fromisoformat(v.replace("Z", "+00:00"))

    def __load_jobs(self) -> None:
        contents = super().read_file_if_exists(self.jobs_file)
        if contents is None:
            self.logger.debug("No jobs file found at jobs.json. Please fetch it first.")
            return

        list_adapter_jobs = TypeAdapter(list[PipelineJob])
        self.all_jobs = list_adapter_jobs.validate_json(contents)

        self.logger.debug(f"Loaded {len(self.all_jobs)} jobs")

        self.all_jobs.sort(key=super().created_at_key_sort)

        run_map = {run.id: run for run in self.all_runs}
        for job in self.all_jobs:
            run = run_map.get(job.run_id)
            if run is not None:
                run.jobs.append(job)

        self.logger.debug("Jobs have been associated with their corresponding runs.")

    def __load_runs(self) -> None:
        contents = super().read_file_if_exists(self.pipeline_file)
        if contents is None:
            self.logger.debug(
                f"No workflow file found at {self.pipeline_file}. Please fetch it first."
            )
            return

        list_adapter_pipeline = TypeAdapter(list[PipelineRun])
        self.all_runs = list_adapter_pipeline.validate_json(contents)

        self.all_runs.sort(key=super().created_at_key_sort)

    def __is_defined_yaml(self, run_obj: PipelineRun) -> bool:
        path = run_obj.path

        if isinstance(path, str) and (
            path.strip().lower().endswith(".yml")
            or path.strip().lower().endswith(".yaml")
        ):
            return True
        name = run_obj.path
        return isinstance(name, str) and name.strip().lower().endswith(".yml")
