import click

from software_metrics_machine.core.infrastructure.configuration.configuration_builder import (
    Driver,
)
from software_metrics_machine.core.infrastructure.repository_factory import (
    create_pipelines_repository,
)
from software_metrics_machine.core.pipelines.plots.view_deployment_frequency import (
    ViewDeploymentFrequency,
)


@click.command(
    name="deployment-frequency",
    help="Plot pipeline deployment frequency by day, week, and month",
)
@click.option(
    "--workflow-path",
    "-w",
    type=str,
    default=None,
    help="Optional workflow path (case-insensitive substring) to filter runs",
)
@click.option(
    "--job-name",
    "-j",
    type=str,
    default=None,
    help="Optional job name (case-insensitive substring) to filter runs",
)
@click.option(
    "--start-date",
    type=str,
    help="Start date (inclusive) in YYYY-MM-DD",
)
@click.option(
    "--end-date",
    type=str,
    help="End date (inclusive) in YYYY-MM-DD",
)
def deployment_frequency(workflow_path, job_name, start_date, end_date):
    result = ViewDeploymentFrequency(
        repository=create_pipelines_repository(driver=Driver.CLI)
    ).plot(
        workflow_path=workflow_path,
        job_name=job_name,
        start_date=start_date,
        end_date=end_date,
    )

    click.echo(result.data)


command = deployment_frequency
