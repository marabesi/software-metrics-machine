import click

from infrastructure.configuration.configuration_builder import (
    ConfigurationBuilder,
    Driver,
)
from providers.github.workflows.plots.view_deployment_frequency import (
    ViewDeploymentFrequency,
)
from providers.github.workflows.repository_workflows import LoadWorkflows


@click.command()
@click.option(
    "--out-file",
    "-o",
    type=str,
    default=None,
    help="Optional path to save the plot image",
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
def deployment_frequency(out_file, workflow_path, job_name, start_date, end_date):
    return ViewDeploymentFrequency(
        repository=LoadWorkflows(
            configuration=ConfigurationBuilder(driver=Driver.CLI).build()
        )
    ).plot(
        out_file=out_file,
        workflow_path=workflow_path,
        job_name=job_name,
        start_date=start_date,
        end_date=end_date,
    )


command = deployment_frequency
