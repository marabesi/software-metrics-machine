import click

from software_metrics_machine.core.infrastructure.repository_factory import (
    create_pipelines_repository,
)
from software_metrics_machine.core.pipelines.plots.view_jobs_average_time_execution import (
    ViewJobsByAverageTimeExecution,
)


@click.command(name="jobs-by-execution-time", help="Plot average job execution time")
@click.option(
    "--workflow-path",
    "-w",
    type=str,
    default=None,
    help="Optional workflow path (case-insensitive substring) to filter runs and jobs",
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
    default=None,
    help="Start date (inclusive) in YYYY-MM-DD",
)
@click.option(
    "--end-date",
    type=str,
    help="End date (inclusive) in YYYY-MM-DD",
)
@click.option(
    "--job-name",
    default=None,
    help="Filter jobs by job name",
)
@click.option(
    "--pipeline-raw-filters",
    type=str,
    default=None,
    help="Comma-separated key=value pairs to filter runs (e.g., event=push,target_branch=main)",
)
@click.option(
    "--metric",
    type=str,
    help=(
        "Metric to plot: 'avg' for average duration, 'sum' for total duration and 'count', 'default: 'avg'"
    ),
)
def jobs_by_execution_time(
    workflow_path,
    top,
    event,
    target_branch,
    exclude_jobs,
    start_date,
    end_date,
    job_name,
    pipeline_raw_filters,
    metric,
):
    result = ViewJobsByAverageTimeExecution(
        repository=create_pipelines_repository()
    ).main(
        workflow_path=workflow_path,
        raw_filters=f"event={event},target_branch={target_branch}",
        top=top,
        exclude_jobs=exclude_jobs,
        start_date=start_date,
        end_date=end_date,
        job_name=job_name,
        pipeline_raw_filters=pipeline_raw_filters,
        metric=metric,
    )
    click.echo(result.data)


command = jobs_by_execution_time
