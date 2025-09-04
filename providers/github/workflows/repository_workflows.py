import json
from pathlib import Path
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
