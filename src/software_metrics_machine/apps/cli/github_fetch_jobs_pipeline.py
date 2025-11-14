import click

from software_metrics_machine.core.infrastructure.configuration.configuration_builder import (
    Driver,
)
from software_metrics_machine.core.infrastructure.repository_factory import (
    create_configuration,
    create_pipelines_repository,
)
from software_metrics_machine.providers.github.github_workflow_client import (
    GithubWorkflowClient,
)


@click.command(name="jobs-fetch", help="Fetch job from pipelines")
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
        "Filters to apply to the GitHub API request, in the form key=value,key2=value2 "
        "(e.g., filter=all). See https://docs.github.com/en/rest/actions/workflow-runs?apiVersion=2022-11-28#re-run-a-job-from-a-workflow-run"  # noqa
        "for possible filters."
    ),
)
def fetch_jobs(start_date, end_date, raw_filters):
    configuration = create_configuration(driver=Driver.CLI)
    client = GithubWorkflowClient(configuration=configuration)
    client.fetch_jobs_for_workflows(
        create_pipelines_repository(driver=Driver.CLI),
        start_date=start_date,
        end_date=end_date,
        raw_filters=raw_filters,
    )


command = fetch_jobs
