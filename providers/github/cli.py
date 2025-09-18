import argparse
from prs.cli_view_summary import add_arguments as add_prs_arguments


def main():
    parser = argparse.ArgumentParser(
        description="Unified CLI for generating charts and summaries."
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # PRs command
    prs_parser = subparsers.add_parser("prs", help="Commands related to Pull Requests")
    prs_subparsers = prs_parser.add_subparsers(dest="action", help="Actions for PRs")

    # PRs summarize command
    summarize_parser = prs_subparsers.add_parser("summarize", help="Summarize PRs")
    add_prs_arguments(summarize_parser)  # Load arguments from view_summary.py

    args = parser.parse_args()

    if hasattr(args, "func"):
        args.func(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
