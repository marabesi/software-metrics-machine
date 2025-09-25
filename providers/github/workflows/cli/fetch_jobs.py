import click
from providers.github.github_client import GithubClient
from infrastructure.configuration_builder import ConfigurationBuilder, Driver
from providers.github.workflows.repository_workflows import LoadWorkflows


def fetch_all_job_runs(start_date, end_date, raw_filters):
    client = GithubClient(configuration=ConfigurationBuilder(driver=Driver.CLI).build())
    client.fetch_jobs_for_workflows(
        LoadWorkflows(),
        start_date=start_date,
        end_date=end_date,
        raw_filters=raw_filters,
    )


@click.command()
@click.option(
    "--start-date",
    type=str,
    required=True,
    help="Start date (inclusive) in YYYY-MM-DD",
)
@click.option(
    "--end-date",
    type=str,
    required=True,
    help="End date (inclusive) in YYYY-MM-DD",
)
@click.option(
    "--raw-filters",
    type=str,
    help=(
        "Filters to apply to the GitHub API request, in the form key=value,key2=value2 "
        "(e.g., filter=all). See https://docs.github.com/en/rest/actions/workflow-runs?apiVersion=2022-11-28#re-run-a-job-from-a-workflow-run"  # noqa
        "for possible filters."
    ),
)
def fetch_jobs(start_date, end_date, raw_filters):
    fetch_all_job_runs(
        start_date=start_date,
        end_date=end_date,
        raw_filters=raw_filters,
    )


command = fetch_jobs
