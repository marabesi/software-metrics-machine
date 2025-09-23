import click

from providers.github.workflows.repository_workflows import LoadWorkflows
from providers.github.workflows.plots.view_workflow_runs_by import ViewWorkflowRunsBy


@click.command()
@click.option(
    "--workflow-path",
    "-w",
    type=str,
    default=None,
    help="Optional workflow path (case-insensitive substring) to filter runs",
)
@click.option(
    "--out-file",
    "-o",
    type=str,
    default=None,
    help="Optional path to save the plot image",
)
@click.option(
    "--event",
    type=str,
    default=None,
    help="Filter runs by event (comma-separated e.g. push,pull_request)",
)
@click.option(
    "--target-branch",
    type=str,
    default=None,
    help="Filter runs by target branch (comma-separated)",
)
@click.option(
    "--include-defined-only",
    is_flag=True,
    help="If set, include only workflows that are defined as .yml or .yaml",
)
@click.option(
    "--aggregate-by",
    type=click.Choice(["week", "month"]),
    default="week",
    help="Aggregate the data by 'week' (default) or 'month'",
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
def workflow_runs_by(
    workflow_path,
    out_file,
    event,
    target_branch,
    include_defined_only,
    aggregate_by,
    start_date,
    end_date,
):
    # Filter runs by workflow path
    return ViewWorkflowRunsBy(repository=LoadWorkflows()).main(
        out_file=out_file,
        workflow_path=workflow_path,
        start_date=start_date,
        end_date=end_date,
    )


command = workflow_runs_by
