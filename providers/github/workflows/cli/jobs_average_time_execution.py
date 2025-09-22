import click

from providers.github.workflows.repository_workflows import LoadWorkflows
from providers.github.workflows.plots.view_jobs_average_time_execution import (
    ViewJobsByStatus,
)


@click.command()
@click.option(
    "--workflow-name",
    "-w",
    type=str,
    default=None,
    help="Optional workflow name (case-insensitive substring) to filter runs and jobs",
)
@click.option(
    "--out-file",
    "-o",
    type=str,
    default=None,
    help="Optional path to save the plot image",
)
@click.option(
    "--top",
    type=int,
    default=20,
    help="How many top job names to show",
)
@click.option(
    "--event",
    type=str,
    default=None,
    help="Filter runs by event (comma-separated e.g. push,pull_request,schedule)",
)
@click.option(
    "--target-branch",
    type=str,
    default=None,
    help="Filter jobs by target branch name (comma-separated)",
)
@click.option(
    "--exclude-jobs",
    type=str,
    default=None,
    help="Removes jobs that contain the name from the chart (comma-separated)",
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
    "--force-all-jobs",
    is_flag=True,
    default=False,
    help="Include setup jobs used by GitHub actions, such as 'Set up job' or 'Checkout code'",
)
def jobs_by_execution_time(
    workflow_name,
    out_file,
    top,
    event,
    target_branch,
    exclude_jobs,
    start_date,
    end_date,
    force_all_jobs,
):
    return ViewJobsByStatus(repository=LoadWorkflows()).main(
        workflow_name=workflow_name,
        out_file=out_file,
        _cli_filters={"event": event, "target_branch": target_branch},
        top=top,
        exclude_jobs=exclude_jobs,
        start_date=start_date,
        end_date=end_date,
        force_all_jobs=force_all_jobs,
    )


command = jobs_by_execution_time
