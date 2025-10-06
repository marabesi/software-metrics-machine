import click

from providers.github.workflows.repository_workflows import LoadWorkflows
from core.pipelines.view_workflow_by_status import (
    ViewWorkflowByStatus,
)


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
    return ViewWorkflowByStatus(repository=LoadWorkflows()).main(
        out_file=out_file,
        workflow_path=workflow_path,
        start_date=start_date,
        end_date=end_date,
    )


command = workflow_by_status
