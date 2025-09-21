import click
from providers.github.github_client import GithubClient
from infrastructure.configuration import Configuration


@click.command(name="fetch", help="Fetch pull requests from GitHub")
@click.option(
    "--months", type=int, default=1, help="Number of months back to fetch (default: 1)"
)
@click.option(
    "--cutoff-date",
    type=str,
    default=None,
    help="Specific cutoff date (YYYY-MM-DD) to fetch PRs from (overrides --months)",
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
def execute(months=1, cutoff_date=None, force=None, start_date=None, end_date=None):
    client = GithubClient(configuration=Configuration())
    client.fetch_prs(
        months_back=months,
        cutoff_date=cutoff_date,
        force=force,
        start_date=start_date,
        end_date=end_date,
    )


command = execute
