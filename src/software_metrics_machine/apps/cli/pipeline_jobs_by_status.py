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
    help="Filter pipeline runs by event (comma-separated e.g. push,pull_request,schedule)",
)
@click.option(
    "--target-branch",
    type=str,
    default=None,
    help="Filter pipeline runs by target branch name (comma-separated)",
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
    "--raw-filters",
    type=str,
    help=(
        "Filters to apply to the jobs dataset, in the form key=value,key2=value2."
        "For possible filters, see https://docs.github.com/en/rest/actions/workflow-jobs?apiVersion=2022-11-28&versionId=free-pro-team%40latest&category=actions&subcategory=workflow-jobs#list-jobs-for-a-workflow-run"  # noqa
    ),
)
def jobs_by_status(
    job_name,
    workflow_path,
    with_pipeline,
    aggregate_by_week,
    event,
    target_branch,
    start_date,
    end_date,
    raw_filters,
):
    result = ViewJobsByStatus(repository=create_pipelines_repository()).main(
        job_name=job_name,
        workflow_path=workflow_path,
        with_pipeline=with_pipeline,
        aggregate_by_week=aggregate_by_week,
        pipeline_raw_filters=f"event={event},target_branch={target_branch}",
        start_date=start_date,
        end_date=end_date,
        raw_filters=raw_filters,
    )
    click.echo(result.data)


command = jobs_by_status
