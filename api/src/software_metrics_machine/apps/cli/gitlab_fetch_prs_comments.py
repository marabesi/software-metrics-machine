import click

from software_metrics_machine.core.prs.pr_types import PRFilters
from software_metrics_machine.providers.gitlab.gitlab_pr_client import GitlabPrsClient
from software_metrics_machine.core.infrastructure.repository_factory import (
    create_configuration,
)


@click.command(name="fetch-comments", help="Fetch comments for merge requests")
@click.option(
    "--force",
    type=bool,
    default=False,
    help="Force re-fetching comments even if files already exist",
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
    help="Filters to apply to the GitLab API request, in the form key=value,key2=value2",
)
def execute(force: bool = False, start_date=None, end_date=None, raw_filters=None):
    client = GitlabPrsClient(configuration=create_configuration())
    client.fetch_pr_comments(
        force=force,
        filters=PRFilters(
            **{
                "start_date": start_date,
                "end_date": end_date,
            }
        ),
        raw_params=raw_filters,
    )


command = execute
