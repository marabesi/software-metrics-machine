import click
from providers.codemaat.fetch import FetchCodemaat
from infrastructure.configuration.configuration_builder import (
    ConfigurationBuilder,
    Driver,
)


@click.command(name="fetch", help="Fetch historical data from a git repository")
@click.option(
    "--start-date",
    type=str,
    required=True,
    help="Filter PRs created on or after this date (ISO 8601)",
)
@click.option(
    "--end-date",
    type=str,
    required=True,
    help="Filter PRs created on or before this date (ISO 8601)",
)
def execute_codemaat(start_date, end_date):
    client = FetchCodemaat(
        configuration=ConfigurationBuilder(driver=Driver.CLI).build()
    )
    client.execute_codemaat(start_date=start_date, end_date=end_date)


command = execute_codemaat
