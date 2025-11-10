import click


@click.command(name="fetch-comments", help="Fetch comments for a given pull request")
@click.option(
    "--force",
    type=bool,
    default=False,
    help="Force re-fetching comments even if files already exist",
)
def execute(force: bool = False):
    pass


command = execute
