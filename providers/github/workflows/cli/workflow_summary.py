import click
from infrastructure.configuration import Configuration
from providers.github.workflows.repository_workflows import LoadWorkflows
from providers.github.workflows.assessment.view_summary import (
    summarize_runs,
    print_summary,
)


@click.command()
@click.option(
    "--max-workflows",
    default=10,
    type=int,
    help="Maximum number of workflows to list in the summary (default: 10)",
)
def summary(max_workflows):
    """
    Print a quick summary of workflow runs.
    """
    lw = LoadWorkflows(configuration=Configuration())
    runs = lw.runs()
    summary = summarize_runs(runs)
    print_summary(summary, max_workflows=max_workflows)


command = summary
