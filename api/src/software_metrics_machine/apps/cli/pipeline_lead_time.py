import click

from software_metrics_machine.core.infrastructure.repository_factory import (
    create_pipelines_repository,
)
from software_metrics_machine.core.pipelines.plots.view_lead_time import (
    ViewLeadTime,
)


@click.command(name="lead-time", help="Compute lead time for a workflow/job")
@click.option("--pipeline", type=str, required=True, help="Pipeline path to filter")
@click.option(
    "--job-name",
    type=str,
    required=True,
    help="Job name to compute lead time for",
)
@click.option("--start-date", type=str, default=None, help="Start date (YYYY-MM-DD)")
@click.option("--end-date", type=str, default=None, help="End date (YYYY-MM-DD)")
@click.option(
    "--pipeline-raw-filters",
    type=str,
    default=None,
    help="Raw Provider filters string (e.g. 'status=draft,author=john')",
)
@click.option(
    "--job-raw-filters",
    type=str,
    default=None,
    help="Raw Provider filters string (e.g. 'status=draft,author=john')",
)
def lead_time(
    pipeline, job_name, start_date, end_date, pipeline_raw_filters, job_raw_filters
):
    viewer = ViewLeadTime(repository=(create_pipelines_repository()))
    result = viewer.main(
        workflow_path=pipeline,
        job_name=job_name,
        start_date=start_date,
        end_date=end_date,
        pipeline_raw_filters=pipeline_raw_filters,
        job_raw_filters=job_raw_filters,
    ).data

    click.echo(result)


command = lead_time
