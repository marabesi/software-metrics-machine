import click

from infrastructure.filesystem_configuration import FilesystemConfiguration
from providers.github.prs.assessment.view_summary import PrViewSummary
from providers.github.prs.prs_repository import LoadPrs


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
@click.option(
    "--output",
    type=str,
    default="text",
    help="Either 'text' or 'json' to specify the output format",
)
def summary(csv, start_date, end_date, output):
    return PrViewSummary(
        repository=LoadPrs(configuration=FilesystemConfiguration().build())
    ).main(csv=csv, start_date=start_date, end_date=end_date, output_format=output)


command = summary
