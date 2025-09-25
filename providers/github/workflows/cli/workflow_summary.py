import click
from infrastructure.configuration.configuration import Configuration
from providers.github.workflows.repository_workflows import LoadWorkflows
from providers.github.workflows.assessment.view_summary import WorkflowRunSummary


@click.command()
@click.option(
    "--max-workflows",
    default=10,
    type=int,
    help="Maximum number of workflows to list in the summary (default: 10)",
)
@click.option(
    "--output",
    type=str,
    default="text",
    help="Either 'text' or 'json' to specify the output format",
)
def summary(max_workflows, output):
    lw = WorkflowRunSummary(
        repository=LoadWorkflows(configuration=Configuration().build())
    )
    lw.print_summary(max_workflows=max_workflows, output_format=output)


command = summary
