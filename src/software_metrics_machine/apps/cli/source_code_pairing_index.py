import click

from software_metrics_machine.core.code.pairing_index import PairingIndex
from software_metrics_machine.core.infrastructure.repository_factory import (
    create_codemaat_repository,
)


@click.command(
    name="pairing-index", help="Calculate pairing index for a git repository"
)
@click.option(
    "--start-date",
    type=str,
    default=None,
    help="Filter commits created on or after this date (ISO 8601)",
)
@click.option(
    "--end-date",
    type=str,
    default=None,
    help="Filter commits created on or before this date (ISO 8601)",
)
@click.option(
    "--authors",
    type=str,
    default=None,
    help="Filter commits by a comma-separated list of author emails",
)
@click.option(
    "--exclude-authors",
    type=str,
    default=None,
    help="Exclude commits from a comma-separated list of author emails",
)
def pairing_index(
    start_date: str | None,
    end_date: str | None,
    authors: str | None,
    exclude_authors: str | None,
):
    result = PairingIndex(repository=create_codemaat_repository()).get_pairing_index(
        start_date=start_date,
        end_date=end_date,
        authors=authors,
        exclude_authors=exclude_authors,
    )
    click.echo(f"{result['pairing_index_percentage']} %")


command = pairing_index
