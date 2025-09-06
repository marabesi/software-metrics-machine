import argparse
from typing import List
from datetime import datetime, timezone, timedelta
from prs.prs_repository import LoadPrs
from date_and_time import datetime_to_local


def summarize_prs(prs: List[dict]) -> dict:
    summary = {}
    total = len(prs)
    summary["total_prs"] = total

    if total == 0:
        summary.update(
            {
                "first_pr": None,
                "last_pr": None,
                "closed_prs": 0,
                "merged_prs": 0,
                "without_conclusion": 0,
                "unique_authors": 0,
            }
        )
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
    created = pr.get("created_at") or None
    merged = pr.get("merged_at") or None
    closed = pr.get("closed_at") or None

    if created:
        print(f"  Created at {datetime_to_local(created)}")
    else:
        print("  Created at <unknown>")
    if merged:
        print(f"  Merged  at {datetime_to_local(merged)}")
    else:
        print("  Not merged")
    if closed:
        print(f"  Closed  at {datetime_to_local(closed)}")
    else:
        print("  Not closed")

    print(f"  {pr['html_url']}")

    return f"#{number} ---  '{title}' --- by {login}"


def print_summary(summary: dict) -> None:
    if summary.get("total_prs", 0) == 0:
        print("No PRs available.")
        return

    print("")
    print("PRs summary:")
    print(f"  Total  PRs: {summary['total_prs']}")
    print(f"  Merged PRs: {summary['merged_prs']}")
    print(f"  Closed (not merged) PRs: {summary['closed_prs']}")
    print(f"  PRs without conclusion (open): {summary['without_conclusion']}")
    print(f"  Unique authors: {summary['unique_authors']}")

    first_created = (
        summary["first_pr"].get("created_at") if summary.get("first_pr") else None
    )
    last_created = (
        summary["last_pr"].get("created_at") if summary.get("last_pr") else None
    )
    if first_created and last_created:
        try:
            dt_first = datetime.fromisoformat(
                first_created.replace("Z", "+00:00")
            ).astimezone(timezone.utc)
            dt_last = datetime.fromisoformat(
                last_created.replace("Z", "+00:00")
            ).astimezone(timezone.utc)
            # ensure dt_first <= dt_last
            if dt_first > dt_last:
                dt_first, dt_last = dt_last, dt_first

            def _last_day_of_month(year: int, month: int) -> int:
                if month == 12:
                    nxt = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
                else:
                    nxt = datetime(year, month + 1, 1, tzinfo=timezone.utc)
                return (nxt - timedelta(days=1)).day

            def _add_months(dt: datetime, months: int) -> datetime:
                # add months to dt preserving day when possible
                total_month = dt.month - 1 + months
                new_year = dt.year + total_month // 12
                new_month = (total_month % 12) + 1
                new_day = min(dt.day, _last_day_of_month(new_year, new_month))
                return datetime(
                    new_year,
                    new_month,
                    new_day,
                    dt.hour,
                    dt.minute,
                    dt.second,
                    dt.microsecond,
                    tzinfo=timezone.utc,
                )

            months = (dt_last.year - dt_first.year) * 12 + (
                dt_last.month - dt_first.month
            )
            # adjust if adding months overshoots
            candidate = _add_months(dt_first, months)
            while candidate > dt_last and months > 0:
                months -= 1
                candidate = _add_months(dt_first, months)

            remainder = dt_last - candidate
            days = remainder.days
            hours = remainder.seconds // 3600
            minutes = (remainder.seconds % 3600) // 60
            print(
                f"  Timespan between first and last PR: {months} months, {days} days, {hours} hours, {minutes} minutes"
            )
        except Exception:
            print("  Timespan: unknown (could not parse created_at timestamps)")
    else:
        print("  Timespan: unknown (missing created_at in first/last PR)")
    print("")
    print("First PR:")
    print(f"  {brief_pr(summary['first_pr'])}")
    print("")
    print("Last PR:")
    print(f"  {brief_pr(summary['last_pr'])}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Print a quick summary of loaded PRs")
    parser.add_argument("--csv", help="Export summary as CSV to the given file path")
    args = parser.parse_args()

    prs = LoadPrs().all_prs
    summary = summarize_prs(prs)

    print_summary(summary)
