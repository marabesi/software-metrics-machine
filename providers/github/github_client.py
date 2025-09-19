import os
from datetime import datetime, timezone
import pandas as pd
import requests
import json
from providers.github.workflows.repository_workflows import LoadWorkflows
from infrastructure.configuration import Configuration
from providers.github.prs.prs_repository import LoadPrs


class GithubClient:

    def __init__(self, configuration: Configuration):
        self.HEADERS = {
            "Authorization": f"token {configuration.github_token}",
            "Accept": "application/vnd.github+json",
        }
        self.repository_slug = configuration.github_repository

    def fetch_prs(self, months_back=1, cutoff_date=None, force=None):
        self.pr_repository = LoadPrs()
        pr_json_path = "prs.json"

        if force:
            print("Force re-fetching PRs even if already fetched")
            self.pr_repository.remove_file(pr_json_path)

        contents = self.pr_repository.read_file_if_exists(pr_json_path)
        if contents is not None:
            print(f"PRs file already exists. Loading PRs from {pr_json_path}")
            return

        # validate mutually exclusive parameters
        if months_back is not None and cutoff_date is not None:
            raise ValueError("Provide only one of 'months_back' or 'cutoff_date'.")

        # default behaviour: if neither provided, use 1 month back
        if months_back is None and cutoff_date is None:
            months_back = 1

        prs = []
        url = f"https://api.github.com/repos/{self.repository_slug}/pulls?state=all&per_page=100&sort=created&direction=desc"  # noqa

        if cutoff_date is not None:
            # parse cutoff_date (expected YYYY-MM-DD)
            try:
                cutoff = datetime.fromisoformat(cutoff_date)
                # make timezone-aware at UTC
                if cutoff.tzinfo is None:
                    cutoff = cutoff.replace(tzinfo=timezone.utc)
            except Exception:
                # try parsing common format
                cutoff = datetime.strptime(cutoff_date, "%Y-%m-%d").replace(
                    tzinfo=timezone.utc
                )
            print(
                f"Fetching PRs for {self.repository_slug} since {cutoff.isoformat()}…"
            )
        else:
            cutoff = datetime.now(timezone.utc) - pd.DateOffset(months=months_back)
            cutoff = cutoff.to_pydatetime()
            print(
                f"Fetching PRs for {self.repository_slug} (last {months_back} month(s))…"
            )
        stop = False
        while url and not stop:
            print(f"  → fetching {url}")
            r = requests.get(url, headers=self.HEADERS)
            r.raise_for_status()
            page_prs = r.json()

            for pr in page_prs:
                created = datetime.fromisoformat(
                    pr["created_at"].replace("Z", "+00:00")
                )
                if created < cutoff:
                    stop = True
                    break
                prs.append(pr)
            # next page logic
            link = r.links.get("next")
            print(f"  → link: {link}")
            url = link["url"] if link and not stop else None

        self.pr_repository.store_file(pr_json_path, prs)

    def fetch_workflows(
        self,
        target_branch: str | None,
        start_date: str | None,
        end_date: str | None,
        raw_filters=None,
    ):
        workflow_repository = LoadWorkflows()
        runs_json_path = "workflows.json"
        contents = workflow_repository.read_file_if_exists(runs_json_path)
        if contents is not None:
            print(
                f"Workflows file already exists. Loading workflows from {runs_json_path}"
            )
            return

        params = {}
        if target_branch:
            params["branch"] = target_branch
        if start_date and end_date:
            params["created"] = f"{start_date}..{end_date}"
            print(
                f"Fetching workflow runs for {self.repository_slug} {start_date} to {end_date}… (it will return 1000 runs at max)"  # noqa
            )
        if raw_filters:
            for f in raw_filters.split(","):
                if "=" in f:
                    k, v = f.split("=", 1)
                    params[k] = v

        runs = []
        url = f"https://api.github.com/repos/{self.repository_slug}/actions/runs?per_page=100"
        while url:
            print(f"  → fetching {url} with params: {str(params)}")
            r = requests.get(
                url,
                headers=self.HEADERS,
                params={**params} if params else None,
            )
            r.raise_for_status()
            data = r.json()
            total = data.get("total_count", 0)
            print(f"    → Response says it has {total} runs")
            for run in data.get("workflow_runs", []):
                runs.append(run)

            print(f"    → Fetched total of {len(runs)} runs out of {total}")

            link = r.links.get("next")
            print(f"  → link: {link}")
            url = link["url"] if link else None
        workflow_repository.store_file(runs_json_path, runs)
        return runs

    def fetch_jobs_for_workflows(
        self, workflows: LoadWorkflows, start_date=None, end_date=None, raw_filters=None
    ):
        # Make progress resumable by storing a small progress file and writing jobs incrementally.
        jobs_json_path = workflows.default_path_for("jobs.json")
        jobs_json_path_incompleted = workflows.default_path_for("jobs_incompleted.json")
        progress_path = workflows.default_path_for("jobs_progress.json")

        contents = workflows.read_file_if_exists("jobs.json")
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

        all_runs = workflows.runs({"start_date": start_date, "end_date": end_date})
        total_runs = len(all_runs)
        run_counter = 0
        params = {}

        if raw_filters:
            for f in raw_filters.split(","):
                if "=" in f:
                    k, v = f.split("=", 1)
                    params[k] = v

        try:
            for run in all_runs:
                run_counter += 1
                run_id = run.get("id")
                if not run_id:
                    continue
                if run_id in processed_runs:
                    # already handled
                    continue

                # if we have a partial for this run, resume from that URL
                if (
                    partial
                    and partial.get("run_id") == run_id
                    and partial.get("next_url")
                ):
                    url = partial.get("next_url")
                else:
                    url = f"https://api.github.com/repos/{self.repository_slug}/actions/runs/{run_id}/jobs?per_page=100"

                while url:
                    print(f" run {run_counter} of {total_runs}  → fetching {url}")
                    r = requests.get(
                        url, headers=self.HEADERS, params={**params} if params else None
                    )
                    r.raise_for_status()
                    data = r.json()
                    page_jobs = data.get("jobs", [])
                    if page_jobs:
                        all_jobs.extend(page_jobs)

                    # next page logic
                    link = r.links.get("next")
                    next_url = link["url"] if link else None

                    if next_url:
                        # save partial progress for this run
                        prog = {
                            "processed_run_ids": list(processed_runs),
                            "partial": {"run_id": run_id, "next_url": next_url},
                        }
                        workflows.store_file("jobs_progress.json", prog)

                        # persist jobs so far
                        workflows.store_file("jobs_incompleted.json", all_jobs)

                        url = next_url
                    else:
                        # finished this run
                        processed_runs.add(run_id)
                        prog = {
                            "processed_run_ids": list(processed_runs),
                            "partial": None,
                        }

                        workflows.store_file("jobs_progress.json", prog)
                        workflows.store_file("jobs_incompleted.json", all_jobs)

                        url = None

        except Exception:
            # on any failure, ensure progress and jobs are persisted before raising
            prog = {"processed_run_ids": list(processed_runs), "partial": partial}
            workflows.store_file("jobs_progress.json", prog)
            workflows.store_file(jobs_json_path_incompleted, all_jobs)
            raise

        # completed all runs successfully; remove progress file
        if os.path.exists(progress_path):
            try:
                os.remove(progress_path)
                os.rename(jobs_json_path_incompleted, jobs_json_path)
            except Exception:
                pass

        print(f"  → Jobs written to {jobs_json_path}")
