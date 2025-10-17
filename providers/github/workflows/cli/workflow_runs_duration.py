import click
from core.infrastructure.configuration.configuration_builder import (
    ConfigurationBuilder,
    Driver,
)
from core.pipelines.pipelines_repository import PipelinesRepository
from core.pipelines.view_runs_duration import ViewRunsDuration


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
    help="Workflow path (exact match, case-insensitive). Can be repeated or supply comma-separated values.",
)
@click.option(
    "--start-date",
    type=str,
    default=None,
    help="Start date (inclusive) in YYYY-MM-DD",
)
@click.option(
    "--end-date",
    type=str,
    default=None,
    help="End date (inclusive) in YYYY-MM-DD",
)
@click.option(
    "--max-runs",
    type=int,
    default=100,
    help="Maximum number of runs to include in the plot",
)
def workflows_run_duration(out_file, workflow_path, start_date, end_date, max_runs):
    configuration = ConfigurationBuilder(driver=Driver.JSON).build()
    return ViewRunsDuration(
        repository=PipelinesRepository(configuration=configuration)
    ).main(
        out_file=out_file,
        workflow_path=workflow_path,
        start_date=start_date,
        end_date=end_date,
    )


command = workflows_run_duration
