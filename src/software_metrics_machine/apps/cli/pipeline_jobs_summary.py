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
def jobs_summary(max_jobs, start_date, end_date):
    repository = create_pipelines_repository(driver=Driver.CLI)
    summary = ViewJobsSummary(repository=repository)
    summary.print_summary(max_jobs=max_jobs, start_date=start_date, end_date=end_date)


command = jobs_summary
