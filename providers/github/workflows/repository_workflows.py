import json
from typing import List, Iterable
from datetime import datetime, date, timezone
from infrastructure.base_repository import BaseRepository
from infrastructure.configuration import Configuration


class LoadWorkflows(BaseRepository):

    def __init__(self):
        super().__init__(configuration=Configuration())
        self.pipeline_file = "workflows.json"
        self.jobs_file = "jobs.json"
        self.all_runs = []
        self.all_jobs = []

        print("Loading runs")

        contents = super().read_file_if_exists(self.pipeline_file)
        if contents is None:
            print(
                f"No workflow file found at {self.pipeline_file}. Please fetch it first."
            )
            return self.all_runs

        self.all_runs = json.loads(contents)
        self.all_runs.sort(key=super().created_at_key_sort)

        print(f"Loaded {len(self.all_runs)} runs")
        print("Load complete.")

        self.__load_jobs()

    def runs(self, filters=None):
        if not filters:
            return self.all_runs

        start_date = filters.get("start_date")
        end_date = filters.get("end_date")

        def _to_dt(v):
            # accept None, datetime, date, or ISO string
            if v is None:
                return None
            if isinstance(v, datetime):
                if v.tzinfo is None:
                    return v.replace(tzinfo=timezone.utc)
                return v.astimezone(timezone.utc)
            if isinstance(v, date):
                # convert date to datetime at midnight UTC
                return datetime(v.year, v.month, v.day, tzinfo=timezone.utc)
            if isinstance(v, str):
                try:
                    dt = datetime.fromisoformat(v.replace("Z", "+00:00"))
                    if dt.tzinfo is None:
                        return dt.replace(tzinfo=timezone.utc)
                    return dt.astimezone(timezone.utc)
                except Exception:
                    return None
            return None

        sd = _to_dt(start_date)
        ed = _to_dt(end_date)

        filtered: List[dict] = []
        for run in self.all_runs:
            created = run.get("created_at")
            if not created:
                continue
            try:
                created_dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
                if created_dt.tzinfo is None:
                    created_dt = created_dt.replace(tzinfo=timezone.utc)
                else:
                    created_dt = created_dt.astimezone(timezone.utc)
            except Exception:
                # if created_at cannot be parsed, skip this run
                continue

            if sd and created_dt < sd:
                continue
            if ed and created_dt > ed:
                continue

            filtered.append(run)

        return filtered

    def jobs(self):
        return self.all_jobs

    def __load_jobs(self):
        contents = super().read_file_if_exists(self.jobs_file)
        if contents is None:
            print("No jobs file found at jobs.json. Please fetch it first.")
            return

        self.all_jobs = []
        self.all_jobs = json.loads(contents)

        print(f"Loaded {len(self.all_jobs)} jobs")
        print("Load complete.")

    def filter_by_job_name(
        self, jobs: List[dict], job_name: Iterable[str]
    ) -> List[dict]:
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
