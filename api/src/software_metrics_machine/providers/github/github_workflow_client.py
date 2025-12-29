import os
import requests
import json
from typing import TypedDict
from datetime import datetime, timedelta
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


class GithubWorkflowClient:

    def __init__(self, configuration: Configuration):
        self.HEADERS = {
            "Authorization": f"token {configuration.github_token}",
            "Accept": "application/vnd.github+json",
        }
        self.repository_slug = configuration.github_repository
        self.pr_repository = PrsRepository(configuration=configuration)
        self.configuration = configuration
        self.logger = Logger(configuration=configuration).get_logger()

    def fetch_workflows(
        self,
        target_branch: str | None,
        start_date: str | None,
        end_date: str | None,
        raw_filters=None,
        step_by: str | None = None,
    ) -> FetchPipelinesResult:
        workflow_repository = PipelinesRepository(configuration=self.configuration)
        runs_json_path = "workflows.json"
        contents = workflow_repository.read_file_if_exists(runs_json_path)
        if contents is not None:
            return FetchPipelinesResult(
                message=f"Workflows file already exists. Loading workflows from {runs_json_path}",
                file_path=workflow_repository.default_path_for(runs_json_path),
            )

        params = self.pr_repository.parse_raw_filters(raw_filters)
        if target_branch:
            params["branch"] = target_branch

        runs = []
        url: str | None = None

        if step_by == "day" and start_date and end_date:
            current_date = datetime.strptime(start_date, "%Y-%m-%d")
            end_date_obj = datetime.strptime(end_date, "%Y-%m-%d")

            while current_date <= end_date_obj:
                day_str = current_date.strftime("%Y-%m-%d")
                params["created"] = f"{day_str}..{day_str}"
                self.logger.debug(
                    f"Fetching workflow runs for {self.repository_slug} on {day_str}"
                )

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
                current_date += timedelta(days=1)
        elif step_by == "hour" and start_date and end_date:
            current_date = datetime.strptime(start_date, "%Y-%m-%d")
            end_date_obj = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(
                hours=23, minutes=59
            )

            while current_date <= end_date_obj:
                hour_str_start = current_date.strftime("%Y-%m-%dT%H:00:00")
                hour_str_end = (current_date + timedelta(hours=1)).strftime(
                    "%Y-%m-%dT%H:00:00"
                )
                params["created"] = f"{hour_str_start}..{hour_str_end}"
                print(
                    f"Fetching workflow runs for {self.repository_slug} on {hour_str_start} to {hour_str_end}"  # noqa
                )

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

                    if int(total) == len(runs):
                        break

                    link = r.links.get("next")
                    print(f"  → link: {link}")
                    url = link["url"] if link else None
                current_date += timedelta(hours=1)
        else:
            if start_date and end_date:
                params["created"] = f"{start_date}..{end_date}"
                print(
                    f"Fetching workflow runs for {self.repository_slug} {start_date} to {end_date} (it will return 1000 runs at max)"  # noqa
                )
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

        workflow_repository.store_file(runs_json_path, as_json_string(runs))

        return FetchPipelinesResult(
            message=f"Fetched {len(runs)}",
            file_path=workflow_repository.default_path_for(runs_json_path),
        )

    def fetch_jobs_for_workflows(
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

        all_runs = workflows.runs(
            PipelineFilters(**{"start_date": start_date, "end_date": end_date})
        )
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
                    print(f" run {run_counter} of {total_runs} → fetching {url}")
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
                        workflows.store_file("jobs_progress.json", as_json_string(prog))
                        workflows.store_file(
                            "jobs_incompleted.json", as_json_string(all_jobs)
                        )

                        url = next_url
                    else:
                        # finished this run
                        processed_runs.add(run_id)
                        prog = {
                            "processed_run_ids": list(processed_runs),
                            "partial": None,
                        }

                        workflows.store_file("jobs_progress.json", as_json_string(prog))
                        workflows.store_file(
                            "jobs_incompleted.json", as_json_string(all_jobs)
                        )

                        url = None

        except Exception:
            # on any failure, ensure progress and jobs are persisted before raising
            prog = {"processed_run_ids": list(processed_runs), "partial": partial}
            workflows.store_file("jobs_progress.json", as_json_string(prog))
            raise

        # completed all runs successfully; remove progress file
        if os.path.exists(progress_path):
            try:
                os.remove(progress_path)
                os.rename(jobs_json_path_incompleted, jobs_json_path)
            except Exception:
                pass

        print(f"  → Jobs written to {jobs_json_path}")
