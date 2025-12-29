import click

from software_metrics_machine.core.infrastructure.repository_factory import (
    create_pipelines_repository,
)
from software_metrics_machine.core.pipelines.plots.view_pipeline_by_status import (
    ViewPipelineByStatus,
)


@click.command(name="pipeline-by-status", help="Plot pipeline runs by their status")
@click.option(
    "--workflow-path",
    "-w",
    type=str,
    default=None,
    help="Optional workflow path (case-insensitive substring) to filter runs",
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
@click.option(
    "--raw-filters",
    type=str,
    help=(
        "Filters to apply to the pipeline dataset, in the form key=value,key2=value2."
    ),
)
def pipeline_by_status(workflow_path, start_date, end_date, raw_filters):
    result = ViewPipelineByStatus(repository=create_pipelines_repository()).main(
        workflow_path=workflow_path,
        start_date=start_date,
        end_date=end_date,
        raw_filters=raw_filters,
    )
    click.echo(result.data)


command = pipeline_by_status
