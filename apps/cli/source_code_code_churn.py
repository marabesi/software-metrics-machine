import click

from core.infrastructure.configuration.configuration_builder import (
    ConfigurationBuilder,
    Driver,
)
from providers.codemaat.plots.code_churn import CodeChurnViewer
from providers.codemaat.codemaat_repository import CodemaatRepository


@click.command()
@click.option(
    "--out-file",
    "-o",
    type=str,
    default=None,
    help="Optional path to save the plot image",
)
@click.option(
    "--start-date",
    type=str,
    default=None,
    help="Filter code churn data on or after this date (ISO 8601)",
)
@click.option(
    "--end-date",
    type=str,
    default=None,
    help="Filter code churn data on or before this date (ISO 8601)",
)
def code_churn(out_file, start_date, end_date):
    """Plot the code churn rate over time."""
    return CodeChurnViewer(
        repository=CodemaatRepository(
            configuration=ConfigurationBuilder(Driver.JSON).build()
        )
    ).render(
        out_file=out_file,
        start_date=start_date,
        end_date=end_date,
    )


command = code_churn
