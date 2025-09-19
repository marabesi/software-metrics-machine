from providers.github.github_client import GithubClient
from infrastructure.configuration import Configuration


def execute(months_back=1, cutoff_date=None, force=None):
    client = GithubClient(configuration=Configuration())
    client.fetch_prs(months_back=months_back, cutoff_date=cutoff_date, force=force)


def add_arguments(subparser):
    subparser.add_argument(
        "--months",
        type=int,
        default=None,
        help="Number of months back to fetch (default: 1)",
    )
    subparser.add_argument(
        "--cutoff-date",
        type=str,
        default=None,
        help="Specific cutoff date (YYYY-MM-DD) to fetch PRs from (overrides --months)",
    )
    subparser.add_argument(
        "--force",
        type=bool,
        default=False,
        help="Force re-fetching PRs even if already fetched",
    )
    subparser.set_defaults(func=execute)
