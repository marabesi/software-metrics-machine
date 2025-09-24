import click
from infrastructure.configuration import Configuration
from providers.github.workflows.repository_workflows import LoadWorkflows
from providers.github.workflows.assessment.view_summary import WorkflowRunSummary


@click.command()
@click.option(
    "--max-workflows",
    default=10,
    type=int,
    help="Maximum number of workflows to list in the summary (default: 10)",
)
def summary(max_workflows):
    lw = WorkflowRunSummary(repository=LoadWorkflows(configuration=Configuration()))
    lw.print_summary(max_workflows=max_workflows)


command = summary
