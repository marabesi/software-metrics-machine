import click
from core.infrastructure.configuration.configuration_builder import (
    ConfigurationBuilder,
    Driver,
)
from core.pipelines.pipelines_repository import PipelinesRepository
from providers.github.workflows.assessment.view_summary import WorkflowRunSummary


@click.command()
@click.option(
    "--max-workflows",
    default=10,
    type=int,
    help="Maximum number of workflows to list in the summary (default: 10)",
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
    "--output",
    type=str,
    default="text",
    help="Either 'text' or 'json' to specify the output format",
)
def summary(max_workflows, start_date, end_date, output):
    lw = WorkflowRunSummary(
        repository=PipelinesRepository(
            configuration=ConfigurationBuilder(driver=Driver.JSON).build()
        )
    )
    lw.print_summary(
        max_workflows=max_workflows,
        start_date=start_date,
        end_date=end_date,
        output_format=output,
    )


command = summary
