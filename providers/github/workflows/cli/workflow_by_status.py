import click

from providers.github.workflows.plots.view_workflow_by_status import (
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
    "--workflow-name",
    "-w",
    type=str,
    default=None,
    help="Optional workflow name (case-insensitive substring) to filter runs",
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
def view_workflow_by_status(out_file, workflow_name, start_date, end_date):
    return ViewWorkflowByStatus().main(
        out_file=out_file,
        workflow_name=workflow_name,
        start_date=start_date,
        end_date=end_date,
    )


command = view_workflow_by_status
