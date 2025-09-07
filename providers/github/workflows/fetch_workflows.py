import argparse
from github_client import GithubClient
from infrastructure.configuration import Configuration
from workflows.repository_workflows import LoadWorkflows
from datetime import datetime


def fetch_all_workflow_runs(
    target_branch, with_jobs, start_date, end_date, raw_filters
):
    client = GithubClient(configuration=Configuration())
    client.fetch_workflows(
        target_branch=target_branch,
        start_date=start_date,
        end_date=end_date,
        raw_filters=raw_filters,
    )
    if with_jobs:
        client.fetch_jobs_for_workflows(LoadWorkflows())


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Fetch workflow runs from the last N months or between start/end dates."
    )
    parser.add_argument(
        "--target-branch",
        type=str,
        default=None,
        help="The branch to filter workflow runs",
    )
    parser.add_argument("--with-jobs", help="Fetch jobs for each workflow run")
    parser.add_argument(
        "--start-date",
        type=str,
        help="Start date (inclusive) in YYYY-MM-DD",
    )
    parser.add_argument(
        "--end-date", type=str, help="End date (inclusive) in YYYY-MM-DD"
    )
    parser.add_argument(
        "--raw-filters",
        type=str,
        help="Filters to apply to the GitHub API request, in the form key=value,key2=value2 (e.g., event=push,actor=someuser). See https://docs.github.com/en/rest/actions/workflow-runs?apiVersion=2022-11-28#list-workflow-runs-for-a-repository for possible filters.",  # noqa
    )
    args = parser.parse_args()

    # if start and end provided, compute months_back (approx) from range
    if args.start_date and args.end_date:
        try:
            start = datetime.fromisoformat(args.start_date)
            end = datetime.fromisoformat(args.end_date)
            if start > end:
                raise ValueError("start-date must be before or equal to end-date")
            days = (end - start).days + 1
            months = max(1, (days + 29) // 30)
        except Exception as e:
            parser.error(f"Invalid date(s): {e}")

    fetch_all_workflow_runs(
        target_branch=args.target_branch,
        with_jobs=args.with_jobs,
        start_date=args.start_date,
        end_date=args.end_date,
        raw_filters=args.raw_filters,
    )
