import click

from software_metrics_machine.core.infrastructure.repository_factory import (
    create_configuration,
)
from software_metrics_machine.providers.github.github_pr_client import GithubPrsClient


@click.command(name="fetch", help="Fetch pull requests from GitHub")
@click.option(
    "--months", type=int, default=1, help="Number of months back to fetch (default: 1)"
)
@click.option(
    "--force",
    type=bool,
    default=False,
    help="Force re-fetching PRs even if already fetched",
)
@click.option(
    "--start-date",
    type=str,
    default=None,
    help="Filter PRs created on or after this date (ISO 8601)",
)
@click.option(
    "--end-date",
    type=str,
    default=None,
    help="Filter PRs created on or before this date (ISO 8601)",
)
@click.option(
    "--raw-filters",
    type=str,
    help="Filters to apply to the GitHub API request, in the form key=value,key2=value2"
    "(e.g., event=push,actor=someuser). See https://docs.github.com/en/rest/pulls/pulls"
    "for possible filters.",
)
def execute(months=1, force=None, start_date=None, end_date=None, raw_filters=None):
    client = GithubPrsClient(configuration=create_configuration())
    client.fetch_prs(
        months=months,
        force=force,
        start_date=start_date,
        end_date=end_date,
        raw_filters=raw_filters,
    )
    click.echo("Fetch data has been completed")


command = execute
