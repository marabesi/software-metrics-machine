import json
from typing import List, Iterable
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
            return

        self.all_runs = json.loads(contents)
        self.all_runs.sort(key=super().created_at_key_sort)

        print(f"Loaded {len(self.all_runs)} runs")
        print("Load complete.")

        self.__load_jobs()

    def jobs(self, filters=None):
        if not filters:
            return self.all_jobs

        start_date = filters.get("start_date")
        end_date = filters.get("end_date")

        if start_date and end_date:
            return super().filter_by_date_range(self.all_jobs, start_date, end_date)

    def runs(self, filters=None):
        if not filters:
            return self.all_runs

        start_date = filters.get("start_date")
        end_date = filters.get("end_date")

        if start_date and end_date:
            return super().filter_by_date_range(self.all_runs, start_date, end_date)

    def __load_jobs(self):
        contents = super().read_file_if_exists(self.jobs_file)
        if contents is None:
            print("No jobs file found at jobs.json. Please fetch it first.")
            return

        self.all_jobs = json.loads(contents)
        print(f"Loaded {len(self.all_jobs)} jobs")
        self.all_jobs.sort(key=super().created_at_key_sort)

        # Create a mapping of run_id to runs for quick lookup
        run_id_to_run = {run["id"]: run for run in self.all_runs if "id" in run}

        # Assign jobs to their corresponding runs
        for job in self.all_jobs:
            run_id = job.get("run_id")
            if run_id and run_id in run_id_to_run:
                run = run_id_to_run[run_id]
                if "jobs" not in run:
                    run["jobs"] = []  # Initialize the jobs list if not present
                run["jobs"].append(job)

        print("Jobs have been associated with their corresponding runs.")
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
