import click

from software_metrics_machine.core.infrastructure.repository_factory import (
    create_configuration,
)
from software_metrics_machine.providers.jira.jira_client import JiraIssuesClient


@click.command(name="fetch", help="Fetch issues from Jira")
@click.option(
    "--months", type=int, default=1, help="Number of months back to fetch (default: 1)"
)
@click.option(
    "--force",
    is_flag=True,
    default=False,
    help="Force re-fetching issues even if already fetched",
)
@click.option(
    "--start-date",
    type=str,
    default=None,
    help="Filter issues created on or after this date (ISO 8601)",
)
@click.option(
    "--end-date",
    type=str,
    default=None,
    help="Filter issues created on or before this date (ISO 8601)",
)
@click.option(
    "--raw-filters",
    type=str,
    help="Filters to apply to the Jira API request, in the form key=value,key2=value2",
)
@click.option(
    "--issue-type",
    type=str,
    default=None,
    help="Filter by issue type (e.g., Bug, Story, Task)",
)
@click.option(
    "--status",
    type=str,
    default=None,
    help="Filter by status (e.g., Open, In Progress, Done)",
)
def execute(
    months=1,
    force=False,
    start_date=None,
    end_date=None,
    raw_filters=None,
    issue_type=None,
    status=None,
):
    try:
        client = JiraIssuesClient(configuration=create_configuration())
        client.fetch_issues(
            months=months,
            force=force,
            start_date=start_date,
            end_date=end_date,
            raw_filters=raw_filters,
            issue_type=issue_type,
            status=status,
        )
        click.echo("✅ Fetch issues completed successfully")
    except Exception as e:
        click.echo(f"❌ Error fetching issues: {str(e)}", err=True)
        raise


command = execute
