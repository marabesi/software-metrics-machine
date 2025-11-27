import click

from software_metrics_machine.core.infrastructure.configuration.configuration_builder import (
    Driver,
)
from software_metrics_machine.core.infrastructure.repository_factory import (
    create_pipelines_repository,
)
from software_metrics_machine.core.pipelines.plots.view_jobs_summary import (
    ViewJobsSummary,
)


@click.command(
    name="jobs-summary", help="Print information about the data of pipeline jobs"
)
@click.option(
    "--max-jobs",
    type=int,
    default=10,
    help="Maximum number of job names to list in the summary (default: 10)",
)
@click.option(
    "--start-date",
    type=str,
    required=False,
    default=None,
    help="Start date (inclusive) in YYYY-MM-DD",
)
@click.option(
    "--end-date",
    type=str,
    required=False,
    default=None,
    help="End date (inclusive) in YYYY-MM-DD",
)
@click.option(
    "--pipeline",
    type=str,
    required=False,
    default=None,
    help='Filter jobs by pipeline path or filename (e.g. "/workflows/a.yml" or "a.yml")',
)
def jobs_summary(max_jobs, start_date, end_date, pipeline):
    repository = create_pipelines_repository(driver=Driver.CLI)
    view = ViewJobsSummary(repository=repository)
    result = view.print_summary(
        max_jobs=max_jobs, start_date=start_date, end_date=end_date, pipeline=pipeline
    )

    if not result or result.get("total_jobs", 0) == 0:
        click.echo("No job executions available.")
        return result

    click.echo("\nJobs summary:")
    click.echo(f"  Total job executions: {result.get('total_jobs')}")

    concls = result.get("conclusions") or {}
    if concls:
        click.echo("")
        click.echo("Conclusions:")
        for k, v in sorted(concls.items(), key=lambda x: x[1], reverse=True):
            click.echo(f" {k}  : {v}")

    click.echo("")
    click.echo(f"Unique job names: {result.get('unique_jobs')}")

    jobs_by_name = result.get("jobs_by_name") or {}
    if jobs_by_name:
        click.echo("")
        click.echo("Executions by job name:")
        for name, info in jobs_by_name.items():
            cnt = info.get("count", 0) if isinstance(info, dict) else 0
            title = info.get("title") if isinstance(info, dict) else None
            display_title = f" :: {title}" if title else ""
            click.echo(f"{cnt:5d}  {name}{display_title}")

    first = result.get("first_job") or {}
    last = result.get("last_job") or {}

    click.echo("")
    click.echo("First job:")
    click.echo(f"  Created at: {first.get('created_at')}")
    click.echo(f"  Started at: {first.get('started_at')}")
    click.echo(f"  Completed/Updated at: {first.get('completed_at')}")

    click.echo("")
    click.echo("Last job:")
    click.echo(f"  Created at: {last.get('created_at')}")
    click.echo(f"  Started at: {last.get('started_at')}")
    click.echo(f"  Completed/Updated at: {last.get('completed_at')}")

    return result


command = jobs_summary
