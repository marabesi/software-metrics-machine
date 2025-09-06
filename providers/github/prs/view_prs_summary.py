import argparse
import json
from typing import List
from datetime import datetime

from prs.prs_repository import LoadPrs


def summarize_prs(prs: List[dict]) -> dict:
    summary = {}
    total = len(prs)
    summary["total_prs"] = total

    if total == 0:
        summary.update({
            "first_pr": None,
            "last_pr": None,
            "closed_prs": 0,
            "merged_prs": 0,
            "without_conclusion": 0,
            "unique_authors": 0,
        })
        return summary

    # first and last based on the loaded order
    first = prs[0]
    last = prs[-1]
    summary["first_pr"] = first
    summary["last_pr"] = last

    merged = [p for p in prs if p.get("merged_at")]
    closed = [p for p in prs if p.get("closed_at") and not p.get("merged_at")]
    without = [p for p in prs if not p.get("closed_at") and not p.get("merged_at")]

    summary["merged_prs"] = len(merged)
    summary["closed_prs"] = len(closed)
    summary["without_conclusion"] = len(without)

    # count unique authors (use login when available)
    authors = set()
    for p in prs:
        user = p.get("user") or {}
        if isinstance(user, dict):
            login = user.get("login")
            if login:
                authors.add(login)
            else:
                authors.add("<unknown>")
        else:
            authors.add(str(user))

    summary["unique_authors"] = len(authors)
    return summary


def brief_pr(pr: dict) -> str:
    if not pr:
        return "<none>"
    number = pr.get("number") or pr.get("id") or "?"
    title = pr.get("title") or "<no title>"
    user = pr.get("user") or {}
    login = (user.get("login") if isinstance(user, dict) else str(user)) or "<unknown>"
    created = pr.get("created_at") or pr.get("created") or "<no created_at>"
    return f"#{number} '{title}' by {login} created {created}"


def print_summary(summary: dict) -> None:
    if summary.get("total_prs", 0) == 0:
        print("No PRs available.")
        return

    print("PRs summary:")
    print(f"  Total PRs: {summary['total_prs']}")
    print(f"  Merged PRs: {summary['merged_prs']}")
    print(f"  Closed (not merged) PRs: {summary['closed_prs']}")
    print(f"  PRs without conclusion (open): {summary['without_conclusion']}")
    print(f"  Unique authors: {summary['unique_authors']}")

    # compute timespan between first and last PR created_at
    first_created = summary['first_pr'].get('created_at') if summary.get('first_pr') else None
    last_created = summary['last_pr'].get('created_at') if summary.get('last_pr') else None
    if first_created and last_created:
        try:
            dt_first = datetime.fromisoformat(first_created.replace('Z', '+00:00'))
            dt_last = datetime.fromisoformat(last_created.replace('Z', '+00:00'))
            total_seconds = int(abs((dt_last - dt_first).total_seconds()))
            days = total_seconds // 86400
            hours = (total_seconds % 86400) // 3600
            minutes = (total_seconds % 3600) // 60
            print(f"  Timespan between first and last PR: {days} days, {hours} hours, {minutes} minutes")
        except Exception:
            print("  Timespan: unknown (could not parse created_at timestamps)")
    else:
        print("  Timespan: unknown (missing created_at in first/last PR)")
    print("")
    print("First PR:")
    print(f"  {brief_pr(summary['first_pr'])}")
    print(f"  Created at {summary['first_pr']['created_at']}")
    print(f"  Merged at {summary['first_pr']['merged_at']}")
    print(f"  Closed at {summary['first_pr']['closed_at']}")
    print(f"  {summary['first_pr']['html_url']}")
    # print(json.dumps(summary['first_pr'], indent=2, ensure_ascii=False))
    print("")
    print("Last PR:")
    print(f"  {brief_pr(summary['last_pr'])}")
    print(f"  Created at {summary['last_pr']['created_at']}")
    print(f"  Merged at {summary['last_pr']['merged_at']}")
    print(f"  Closed at {summary['last_pr']['closed_at']}")
    print(f"  {summary['last_pr']['html_url']}")
    # print(json.dumps(summary['last_pr'], indent=2, ensure_ascii=False))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Print a quick summary of loaded PRs")
    parser.add_argument("--raw", action="store_true", help="Print raw JSON for first/last PRs without brief header")
    args = parser.parse_args()

    repo = LoadPrs()
    prs = getattr(repo, "all_prs", [])

    summary = summarize_prs(prs)
    if args.raw:
        print(json.dumps(summary, indent=2, ensure_ascii=False))
    else:
        print_summary(summary)
