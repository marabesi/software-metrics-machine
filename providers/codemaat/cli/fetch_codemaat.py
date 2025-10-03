import click


@click.command(name="fetch", help="Fetch historical data from a git repository")
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
def execute(start_date=None, end_date=None):
    pass


command = execute
