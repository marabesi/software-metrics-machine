import click


@click.command(
    name="pairing-index", help="Calculate pairing index for a git repository"
)
def pairing_index():
    pass


command = pairing_index
