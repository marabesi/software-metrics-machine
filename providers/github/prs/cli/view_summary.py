import click

from providers.github.prs.assessment.view_summary import execute


@click.command()
@click.option(
    "--csv",
    type=str,
    default=None,
    help="Export summary as CSV to the given file path",
)
@click.option(
    "--start-date",
    type=str,
    default=None,
    help="Filter PRs created on or after this date (ISO 8601)",
)
@click.option(
    "--end-date",
    type=str,
    default=None,
    help="Filter PRs created on or before this date (ISO 8601)",
)
def pr_data_summary(csv, start_date, end_date):
    return execute(csv, start_date, end_date)


command = pr_data_summary
