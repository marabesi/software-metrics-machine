import click

from software_metrics_machine.core.infrastructure.repository_factory import (
    create_configuration,
)
from software_metrics_machine.providers.jira.jira_client import JiraIssuesClient


@click.command(name="fetch-changelog", help="Fetch issue change history from Jira")
@click.option(
    "--force",
    is_flag=True,
    default=False,
    help="Force re-fetching changelogs even if already fetched",
)
def execute(force=False):
    try:
        client = JiraIssuesClient(configuration=create_configuration())
        client.fetch_issue_changes(force=force)
        click.echo("✅ Fetch changelogs completed successfully")
    except Exception as e:
        click.echo(f"❌ Error fetching changelogs: {str(e)}", err=True)
        raise


command = execute
