import click

from software_metrics_machine.core.infrastructure.repository_factory import (
    create_configuration,
)
from software_metrics_machine.providers.sonarqube.sonarqube_client import (
    SonarqubeMeasuresClient,
)


@click.command(name="fetch", help="Fetch measures from SonarQube")
@click.option(
    "--metric-keys",
    type=str,
    default=None,
    help="Comma separated metric keys to fetch (e.g. 'bugs,coverage')",
)
@click.option(
    "--project-key",
    type=str,
    default=None,
    help="SonarQube project key (overrides configuration.sonar_project)",
)
@click.option(
    "--force",
    is_flag=True,
    default=False,
    help="Force re-fetching measures even if already fetched",
)
def execute(metric_keys=None, project_key=None, force=False):
    try:
        client = SonarqubeMeasuresClient(configuration=create_configuration())
        client.fetch_measures(project_key=project_key, metric_keys=metric_keys, force=force)
        click.echo("✅ Fetch SonarQube measures completed successfully")
    except Exception as e:
        click.echo(f"❌ Error fetching SonarQube measures: {str(e)}", err=True)
        raise


command = execute
