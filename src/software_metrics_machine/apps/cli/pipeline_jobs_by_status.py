import click

from software_metrics_machine.core.infrastructure.repository_factory import (
    create_pipelines_repository,
)
from software_metrics_machine.core.pipelines.plots.view_jobs_by_status import (
    ViewJobsByStatus,
)


@click.command(name="jobs-by-status", help="Plot job executions by their status")
@click.option(
    "--job-name",
    type=str,
    required=True,
    help="Job name to count/plot",
)
@click.option(
    "--workflow-path",
    "-w",
    type=str,
    default=None,
    help="Optional workflow path (case-insensitive substring) to filter runs and jobs",
)
@click.option(
    "--out-file",
    "-o",
    type=str,
    default=None,
    help="Optional path to save the plot image",
)
@click.option(
    "--with-pipeline",
    type=str,
    help="Show workflow summary alongside job chart",
)
@click.option(
    "--aggregate-by-week",
    is_flag=True,
    help="Aggregate job executions by ISO week instead of day",
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
    help="Filter runs/jobs by target branch name (comma-separated)",
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
    "--force-all-jobs",
    is_flag=True,
    default=False,
    help="Include setup jobs used by GitHub actions, such as 'Set up job' or 'Checkout code'",
)
def jobs_by_status(
    job_name,
    workflow_path,
    out_file,
    with_pipeline,
    aggregate_by_week,
    event,
    target_branch,
    start_date,
    end_date,
    force_all_jobs,
):
    return ViewJobsByStatus(repository=create_pipelines_repository()).main(
        job_name=job_name,
        workflow_path=workflow_path,
        out_file=out_file,
        with_pipeline=with_pipeline,
        aggregate_by_week=aggregate_by_week,
        raw_filters=f"event={event},target_branch={target_branch}",
        start_date=start_date,
        end_date=end_date,
        force_all_jobs=force_all_jobs,
    )


command = jobs_by_status
