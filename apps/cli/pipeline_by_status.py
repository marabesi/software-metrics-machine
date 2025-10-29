import click

from core.infrastructure.repository_factory import create_pipelines_repository
from core.pipelines.plots.view_pipeline_by_status import ViewPipelineByStatus


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
    "--start-date",
    type=str,
    help="Start date (inclusive) in YYYY-MM-DD",
)
@click.option(
    "--end-date",
    type=str,
    help="End date (inclusive) in YYYY-MM-DD",
)
def workflow_by_status(out_file, workflow_path, start_date, end_date):
    return ViewPipelineByStatus(repository=create_pipelines_repository()).main(
        out_file=out_file,
        workflow_path=workflow_path,
        start_date=start_date,
        end_date=end_date,
    )


command = workflow_by_status
