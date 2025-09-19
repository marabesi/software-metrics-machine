import argparse
from providers.github.prs.view_summary import add_arguments as add_prs_arguments
from providers.github.prs.fetch_prs import add_arguments as add_fetch_arguments


def main():
    parser = argparse.ArgumentParser(
        description="Unified CLI for generating charts and summaries."
    )
    subparsers = parser.add_subparsers(help="Available commands")

    prs_parser = subparsers.add_parser("prs", help="Commands related to Pull Requests")
    prs_subparsers = prs_parser.add_subparsers(help="Actions for PRs")

    summarize_parser = prs_subparsers.add_parser("summarize", help="Summarize PRs")
    add_prs_arguments(summarize_parser)

    fetch_parser = prs_subparsers.add_parser("fetch", help="Summarize PRs")
    fetch_subparsers = fetch_parser.add_subparsers(
        dest="action", help="Actions for fetching PRs"
    )
    fetch_all_parser = fetch_subparsers.add_parser("all", help="Fetch all PRs")
    add_fetch_arguments(fetch_all_parser)
    args = parser.parse_args()

    if hasattr(args, "func"):
        args.func(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
