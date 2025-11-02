import click

from core.code.pairing_index import PairingIndex
from core.infrastructure.repository_factory import create_codemaat_repository


@click.command(
    name="pairing-index", help="Calculate pairing index for a git repository"
)
def pairing_index():
    return PairingIndex(repository=create_codemaat_repository()).get_pairing_index()


command = pairing_index
