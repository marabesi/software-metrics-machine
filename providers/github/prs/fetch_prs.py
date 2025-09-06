from github_client import GithubClient
from infrastructure.configuration import Configuration
import argparse


def fetch_all_prs(months_back=1, force=None):
    client = GithubClient(configuration=Configuration())
    client.fetch_prs(months_back=months_back, force=force)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fetch Pull requests from the last N months.")
    parser.add_argument("--months", type=int, default=1, help="Number of months back to fetch (default: 1)")
    parser.add_argument("--force", type=bool, default=False, help="Force re-fetching PRs even if already fetched")
    args = parser.parse_args()
    fetch_all_prs(months_back=args.months, force=args.force)