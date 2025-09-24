import click
from providers.github.github_client import GithubClient
from infrastructure.filesystem_configuration import FilesystemConfiguration


def fetch_all_workflow_runs(target_branch, start_date, end_date, raw_filters):
    client = GithubClient(configuration=FilesystemConfiguration().build())
    client.fetch_workflows(
        target_branch=target_branch,
        start_date=start_date,
        end_date=end_date,
        raw_filters=raw_filters,
    )


@click.command()
@click.option(
    "--target-branch",
    type=str,
    default=None,
    help="The branch to filter workflow runs",
)
@click.option(
    "--start-date",
    type=str,
    help="Start date (inclusive) in YYYY-MM-DD",
)
@click.option("--end-date", type=str, help="End date (inclusive) in YYYY-MM-DD")
@click.option(
    "--raw-filters",
    type=str,
    help=(
        "Filters to apply to the GitHub API request, in the form key=value,key2=value2 "
        "(e.g., event=push,actor=someuser). See https://docs.github.com/en/rest/actions/workflow-runs?apiVersion=2022-11-28#list-workflow-runs-for-a-repository"  # noqa
        "for possible filters."
    ),
)
def fetch(target_branch, start_date, end_date, raw_filters):
    fetch_all_workflow_runs(
        target_branch=target_branch,
        start_date=start_date,
        end_date=end_date,
        raw_filters=raw_filters,
    )


command = fetch
