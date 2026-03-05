import os
import requests
import json
from typing import TypedDict
from datetime import datetime, timedelta
from urllib.parse import quote_plus
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)
from software_metrics_machine.core.infrastructure.configuration.configuration import (
    Configuration,
)
from software_metrics_machine.core.pipelines.pipelines_types import PipelineFilters
from software_metrics_machine.core.prs.prs_repository import PrsRepository

from software_metrics_machine.core.infrastructure.logger import Logger
from software_metrics_machine.core.infrastructure.json import as_json_string


class FetchPipelinesResult(TypedDict):
    file_path: str
    message: str


class GitlabPipelinesClient:

    def __init__(self, configuration: Configuration):
        self.HEADERS = {
            "Authorization": f"token {configuration.github_token}",
            "Accept": "application/json",
        }
        self.repository_slug = configuration.github_repository
        self.encoded_project = quote_plus(self.repository_slug)
        self.pr_repository = PrsRepository(configuration=configuration)
        self.configuration = configuration
        self.logger = Logger(configuration=configuration).get_logger()

    def fetch_pipelines(
        self,
        target_branch: str | None,
        start_date: str | None,
        end_date: str | None,
        raw_filters=None,
        step_by: str | None = None,
    ) -> FetchPipelinesResult:
        pipelines_repository = PipelinesRepository(configuration=self.configuration)
        pipelines_json_path = "workflows.json"
        contents = pipelines_repository.read_file_if_exists(pipelines_json_path)
        if contents is not None:
            return FetchPipelinesResult(
                message=f"Pipelines file already exists. Loading pipelines from {pipelines_json_path}",
                file_path=pipelines_repository.default_path_for(pipelines_json_path),
            )

        params = self.pr_repository.parse_raw_filters(raw_filters)
        if target_branch:
            params["ref"] = target_branch

        runs = []

        url: str | None = None

        if step_by in ("day", "hour") and start_date and end_date:
            current_date = datetime.strptime(start_date, "%Y-%m-%d")
            end_date_obj = datetime.strptime(end_date, "%Y-%m-%d")

            step_delta = timedelta(days=1) if step_by == "day" else timedelta(hours=1)

            while current_date <= end_date_obj:
                if step_by == "day":
                    created_range = current_date.strftime("%Y-%m-%d")
                else:
                    created_range = current_date.strftime("%Y-%m-%dT%H:00:00")

                params_chunk = {**params}
                self.logger.debug(
                    f"Fetching pipelines for {self.repository_slug} on {created_range}"
                )

                url = f"https://gitlab.com/api/v4/projects/{self.encoded_project}/pipelines"
                while url:
                    print(f"  → fetching {url} with params: {str(params_chunk)}")
                    r = requests.get(url, headers=self.HEADERS, params={**params_chunk} if params_chunk else None)
                    r.raise_for_status()
                    data = r.json()
                    for run in data:
                        runs.append(run)

                    link = r.links.get("next")
                    print(f"  → link: {link}")
                    url = link["url"] if link else None

                current_date += step_delta
        else:
            if start_date and end_date:
                params["updated_after"] = start_date
                params["updated_before"] = end_date
                print(
                    f"Fetching pipelines for {self.repository_slug} {start_date} to {end_date}"
                )
            url = f"https://gitlab.com/api/v4/projects/{self.encoded_project}/pipelines"
            while url:
                print(f"  → fetching {url} with params: {str(params)}")
                r = requests.get(url, headers=self.HEADERS, params={**params} if params else None)
                r.raise_for_status()
                data = r.json()
                for run in data:
                    runs.append(run)

                link = r.links.get("next")
                print(f"  → link: {link}")
                url = link["url"] if link else None

        pipelines_repository.store_file(pipelines_json_path, as_json_string(runs))

        return FetchPipelinesResult(
            message=f"Fetched {len(runs)}",
            file_path=pipelines_repository.default_path_for(pipelines_json_path),
        )

    def fetch_jobs_for_pipelines(
        self,
        workflows: PipelinesRepository,
        start_date=None,
        end_date=None,
        raw_filters=None,
    ):
        jobs_json_path = workflows.default_path_for("jobs.json")
        jobs_json_path_incompleted = workflows.default_path_for("jobs_incompleted.json")
        progress_path = workflows.default_path_for("jobs_progress.json")

        contents = workflows.read_file_if_exists("jobs.json")
        if contents is not None:
            print(f"Jobs file already exists. Loading jobs from {jobs_json_path}")
            return

        all_jobs = []
        if os.path.exists(jobs_json_path):
            try:
                with open(jobs_json_path, "r") as f:
                    all_jobs = json.load(f)
            except Exception:
                all_jobs = []

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

        all_runs = workflows.runs(PipelineFilters(**{"start_date": start_date, "end_date": end_date}))
        total_runs = len(all_runs)
        if total_runs == 0:
            print(
                f"No runs to fetch jobs for in the date range {start_date} to {end_date}"
            )
            return

        run_counter = 0
        params = self.pr_repository.parse_raw_filters(raw_filters)

        try:
            for run in all_runs:
                run_counter += 1
                run_id = run.id
                if not run_id:
                    continue
                if run_id in processed_runs:
                    continue

                if (
                    partial
                    and partial.get("run_id") == run_id
                    and partial.get("next_url")
                ):
                    url = partial.get("next_url")
                else:
                    url = f"https://gitlab.com/api/v4/projects/{self.encoded_project}/pipelines/{run_id}/jobs"

                while url:
                    print(f" run {run_counter} of {total_runs} → fetching {url}")
                    r = requests.get(url, headers=self.HEADERS, params={**params} if params else None)
                    r.raise_for_status()
                    data = r.json()

                    page_jobs = data if isinstance(data, list) else data.get("jobs", [])
                    if page_jobs:
                        all_jobs.extend(page_jobs)

                    link = r.links.get("next")
                    next_url = link["url"] if link else None

                    if next_url:
                        prog = {
                            "processed_run_ids": list(processed_runs),
                            "partial": {"run_id": run_id, "next_url": next_url},
                        }
                        workflows.store_file("jobs_progress.json", as_json_string(prog))
                        workflows.store_file("jobs_incompleted.json", as_json_string(all_jobs))

                        url = next_url
                    else:
                        processed_runs.add(run_id)
                        prog = {
                            "processed_run_ids": list(processed_runs),
                            "partial": None,
                        }

                        workflows.store_file("jobs_progress.json", as_json_string(prog))
                        workflows.store_file("jobs_incompleted.json", as_json_string(all_jobs))

                        url = None

        except Exception:
            prog = {"processed_run_ids": list(processed_runs), "partial": partial}
            workflows.store_file("jobs_progress.json", as_json_string(prog))
            raise

        if os.path.exists(progress_path):
            try:
                os.remove(progress_path)
                os.rename(jobs_json_path_incompleted, jobs_json_path)
            except Exception:
                pass

        print(f"  → Jobs written to {jobs_json_path}")
