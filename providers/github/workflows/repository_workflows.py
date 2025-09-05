import json
from pathlib import Path
from typing import List, Iterable
from infrastructure.base_repository import BaseRepository

class LoadWorkflows(BaseRepository):

    def __init__(self):
        self.all_runs = []
        self.all_jobs = []

        print(f"Loading runs")
        with open('data/workflows.json', 'r') as f:
            self.all_runs = json.load(f)

        print(f"Loaded {len(self.all_runs)} runs")
        print("Load complete.")
        p = Path("data/jobs.json")  # repo-relative path
        if p.exists():
            print(f"Found {p} ({p.stat().st_size} bytes)")
            self.__load_jobs()

    def runs(self):
        return self.all_runs
    
    def jobs(self):
        return self.all_jobs

    def __load_jobs(self):
        self.all_jobs = []
        print(f"Loading jobs")
        with open('data/jobs.json', 'r') as f:
            self.all_jobs = json.load(f)

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
