import click

from software_metrics_machine.core.infrastructure.repository_factory import (
    create_configuration,
)
from software_metrics_machine.providers.jira.jira_client import JiraIssuesClient


@click.command(name="fetch-comments", help="Fetch issue comments from Jira")
@click.option(
    "--force",
    is_flag=True,
    default=False,
    help="Force re-fetching comments even if already fetched",
)
def execute(force=False):
    try:
        client = JiraIssuesClient(configuration=create_configuration())
        client.fetch_issue_comments(force=force)
        click.echo("✅ Fetch comments completed successfully")
    except Exception as e:
        click.echo(f"❌ Error fetching comments: {str(e)}", err=True)
        raise


command = execute
