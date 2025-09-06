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

        print(f"Loading runs")

        contents = super().read_file_if_exists(self.pipeline_file)
        if contents is None:
            print(f"No workflow file found at {self.pipeline_file}. Please fetch it first.")
            return self.all_runs

        self.all_runs = json.loads(contents)
        self.all_runs.sort(key=super().created_at_key_sort)

        print(f"Loaded {len(self.all_runs)} runs")
        print("Load complete.")

        self.__load_jobs()

    def runs(self):
        return self.all_runs
    
    def jobs(self):
        return self.all_jobs

    def __load_jobs(self):
        contents = super().read_file_if_exists(self.jobs_file)
        if contents is None:
            print(f"No jobs file found at jobs.json. Please fetch it first.")
            return

        self.all_jobs = []
        self.all_jobs = json.loads(contents)

        print(f"Loaded {len(self.all_jobs)} jobs")
        print("Load complete.")

    def filter_by_job_name(self, jobs: List[dict], job_name: Iterable[str]) -> List[dict]:
        """Return jobs excluding any whose name matches one of the provided job_name values.

        Matching is case-insensitive and uses substring matching: if any provided token
        appears in the job's name, that job is excluded.
        """
        job_name_set = {str(l).strip().lower() for l in (job_name or []) if l}
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
