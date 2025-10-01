import click
from providers.github.workflows.assessment.view_jobs_summary import print_summary


@click.command()
@click.option(
    "--max-jobs",
    type=int,
    default=10,
    help="Maximum number of job names to list in the summary (default: 10)",
)
def jobs_summary(max_jobs):
    print_summary(max_jobs=max_jobs)


command = jobs_summary
