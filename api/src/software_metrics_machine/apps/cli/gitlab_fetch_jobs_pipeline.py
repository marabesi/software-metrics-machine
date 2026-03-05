import click

from software_metrics_machine.core.infrastructure.configuration.configuration_builder import (
    Driver,
)
from software_metrics_machine.core.infrastructure.repository_factory import (
    create_configuration,
    create_pipelines_repository,
)
from software_metrics_machine.providers.gitlab.gitlab_pipelines_client import (
    GitlabPipelinesClient,
)


@click.command(name="jobs-fetch", help="Fetch job from pipelines (GitLab)")
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
    "--raw-filters",
    type=str,
    help=(
        "Filters to apply to the GitLab API request, in the form key=value,key2=value2 "
        "for possible filters."
    ),
)
def fetch_jobs(start_date, end_date, raw_filters):
    configuration = create_configuration(driver=Driver.CLI)
    client = GitlabPipelinesClient(configuration=configuration)
    client.fetch_jobs_for_pipelines(
        create_pipelines_repository(driver=Driver.CLI),
        start_date=start_date,
        end_date=end_date,
        raw_filters=raw_filters,
    )


command = fetch_jobs
