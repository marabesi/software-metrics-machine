import os
import sys
from datetime import datetime, timezone
import pandas as pd
import requests
import json
from workflows.repository_workflows import LoadWorkflows
from pathlib import Path
from typing import Optional

class GithubClient:

    def __init__(self):
        self.token = os.getenv("GITHUB_TOKEN")
        self.REPO = os.getenv("REPO")
        self.HEADERS = {
            "Authorization": f"token {self.token}",
            "Accept": "application/vnd.github+json",
        }

        if not self.token:
            print("❌  You must export GITHUB_TOKEN before running.")
            sys.exit(1)

        # format: owner/repo
        if not self.REPO:
            print("❌  Set REPO=owner/repo (e.g. octocat/Hello-World)")
            sys.exit(1)

        Path("data").mkdir(exist_ok=True)

    def fetch_prs(self, months_back=1, state='all', per_page=100, sort='created', direction='desc'):
        """Pulls all pull requests (open+closed) via pagination, stopping when PRs are older than `months_back` months."""
        pr_json_path = os.path.join("data", "prs.json")

        contents = self.__read_file_if_exists(pr_json_path)
        if contents is not None:
            print(f"PRs file already exists. Loading PRs from {pr_json_path}")
            return

        print(f"Fetching PRs for {self.REPO} (last {months_back} month(s))…")
        prs = []
        url = f"https://api.github.com/repos/{self.REPO}/pulls?state=all&per_page=100&sort=created&direction=desc"
        cutoff = datetime.now(timezone.utc) - pd.DateOffset(months=months_back)
        cutoff = cutoff.to_pydatetime()
        stop = False
        while url and not stop:
            print(f"  → fetching {url}")
            r = requests.get(url, headers=self.HEADERS)
            r.raise_for_status()
            page_prs = r.json()

            for pr in page_prs:
                created = datetime.fromisoformat(pr["created_at"].replace("Z", "+00:00"))
                if created < cutoff:
                    stop = True
                    break
                prs.append(pr)
            # next page logic
            link = r.links.get("next")
            print(f"  → link: {link}")
            url = link["url"] if link and not stop else None

        self.__store_file(pr_json_path, prs)

    def fetch_workflows(self, target_branch: str, start_date, end_date):
        runs_json_path = os.path.join("data", "workflows.json")
        contents = self.__read_file_if_exists(runs_json_path)
        if contents is not None:
            print(f"Workflows file already exists. Loading workflows from {runs_json_path}")
            return

        print(f"Fetching workflow runs for {self.REPO} {start_date} to {end_date}…")

        runs = []
        url = f"https://api.github.com/repos/{self.REPO}/actions/runs?per_page=100"
        while url:
            print(f"  → fetching {url}")
            r = requests.get(url, headers=self.HEADERS, params={"branch": target_branch, "created": f"{start_date}..{end_date}", "exclude_pull_requests": "true"})
            r.raise_for_status()
            data = r.json()
            for run in data.get("workflow_runs", []):
                runs.append(run)
            # next page logic
            link = r.links.get("next")
            print(f"  → link: {link}")
            url = link["url"] if link else None

        self.__store_file(runs_json_path, runs)
        return runs


    def fetch_jobs_for_workflows(self, workflows: LoadWorkflows):
        # Make progress resumable by storing a small progress file and writing jobs incrementally.
        os.makedirs("data", exist_ok=True)
        jobs_json_path = os.path.join("data", "jobs.json")
        jobs_json_path_incompleted = os.path.join("data", "jobs_incompleted.json")
        progress_path = os.path.join("data", "jobs_progress.json")

        contents = self.__read_file_if_exists(jobs_json_path)
        if contents is not None:
            print(f"Jobs file already exists. Loading jobs from {jobs_json_path}")
            return

        # load existing jobs if present so we append instead of overwriting
        all_jobs = []
        if os.path.exists(jobs_json_path):
            try:
                with open(jobs_json_path, "r") as f:
                    all_jobs = json.load(f)
            except Exception:
                all_jobs = []

        # load progress (processed run ids and optional partial state)
        processed_runs = set()
        partial = None
        if os.path.exists(progress_path):
            try:
                with open(progress_path, "r") as f:
                    prog = json.load(f)
                    processed_runs = set(prog.get("processed_run_ids", []))
                    partial = prog.get("partial")
            except Exception:
                processed_runs = set()
                partial = None

        all_runs = workflows.runs()
        total_runs = len(all_runs)
        run_counter = 0

        try:
            for run in all_runs:
                run_counter += 1
                run_id = run.get('id')
                if not run_id:
                    continue
                if run_id in processed_runs:
                    # already handled
                    continue

                # if we have a partial for this run, resume from that URL
                if partial and partial.get("run_id") == run_id and partial.get("next_url"):
                    url = partial.get("next_url")
                else:
                    url = f"https://api.github.com/repos/{self.REPO}/actions/runs/{run_id}/jobs?per_page=100"

                while url:
                    print(f" run {run_counter} of {total_runs}  → fetching {url}")
                    r = requests.get(url, headers=self.HEADERS)
                    r.raise_for_status()
                    data = r.json()
                    page_jobs = data.get('jobs', [])
                    if page_jobs:
                        all_jobs.extend(page_jobs)

                    # next page logic
                    link = r.links.get("next")
                    next_url = link["url"] if link else None

                    if next_url:
                        # save partial progress for this run
                        prog = {"processed_run_ids": list(processed_runs), "partial": {"run_id": run_id, "next_url": next_url}}
                        with open(progress_path, "w") as pf:
                            json.dump(prog, pf, indent=2)
                        # persist jobs so far
                        with open(jobs_json_path_incompleted, "w") as jf:
                            json.dump(all_jobs, jf, indent=2)
                        url = next_url
                    else:
                        # finished this run
                        processed_runs.add(run_id)
                        prog = {"processed_run_ids": list(processed_runs), "partial": None}
                        with open(progress_path, "w") as pf:
                            json.dump(prog, pf, indent=2)
                        with open(jobs_json_path_incompleted, "w") as jf:
                            json.dump(all_jobs, jf, indent=2)
                        url = None

        except Exception:
            # on any failure, ensure progress and jobs are persisted before raising
            prog = {"processed_run_ids": list(processed_runs), "partial": partial}
            with open(progress_path, "w") as pf:
                json.dump(prog, pf, indent=2)
            with open(jobs_json_path_incompleted, "w") as jf:
                json.dump(all_jobs, jf, indent=2)
            raise

        # completed all runs successfully; remove progress file
        if os.path.exists(progress_path):
            try:
                os.remove(progress_path)
                os.rename(jobs_json_path_incompleted, jobs_json_path)
            except Exception:
                pass

        print(f"  → Jobs written to {jobs_json_path}")

    def __read_file_if_exists(self, path: str) -> Optional[str]:
        p = Path(path)
        if p.is_file():
            return p.read_text(encoding="utf-8")
        return None

    def __store_file(self, path: str, data: str) -> None:
        with open(path, "w") as f:
            json.dump(data, f, indent=2)
        print(f"  → Data written to {path}")
