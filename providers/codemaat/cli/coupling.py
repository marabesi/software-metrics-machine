import click

from infrastructure.configuration_builder import ConfigurationBuilder, Driver
from providers.codemaat.plots.coupling import CouplingViewer


@click.command()
@click.option(
    "--out-file",
    "-o",
    type=str,
    default=None,
    help="Optional path to save the plot image",
)
def coupling(out_file):
    """Plot coupling graph."""
    return CouplingViewer().render(
        configuration=ConfigurationBuilder(Driver.CLI).build(), out_file=out_file
    )


command = coupling
