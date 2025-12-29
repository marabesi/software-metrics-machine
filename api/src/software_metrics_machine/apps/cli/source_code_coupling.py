import click

from software_metrics_machine.core.infrastructure.repository_factory import (
    create_codemaat_repository,
)
from software_metrics_machine.providers.codemaat.plots.coupling import CouplingViewer


@click.command(name="coupling", help="Plot coupling graph")
@click.option(
    "--ignore-files",
    type=str,
    default=None,
    help="Optional comma-separated glob patterns to ignore (e.g. '*.json,**/**/*.png')",
)
@click.option(
    "--include-only",
    type=str,
    default=None,
    help="Optional comma-separated glob patterns to include only (e.g. '*.py,**/**/*.js')",
)
def coupling(ignore_files, include_only):
    result = CouplingViewer(repository=create_codemaat_repository()).render(
        ignore_files=ignore_files,
        include_only=include_only,
    )
    click.echo(result.data)


command = coupling
