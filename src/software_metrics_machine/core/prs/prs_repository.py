import json
from typing import List, Iterable
from datetime import datetime, timezone

import pandas as pd
from software_metrics_machine.core.infrastructure.file_system_base_repository import (
    FileSystemBaseRepository,
)
from software_metrics_machine.core.infrastructure.configuration.configuration import (
    Configuration,
)
from software_metrics_machine.core.prs.pr_types import LabelSummary, PRDetails


class PrsRepository(FileSystemBaseRepository):
    def __init__(self, configuration: Configuration):
        super().__init__(configuration=configuration)
        self.file = "prs.json"
        self.all_prs: List[PRDetails] = []
        self.all_prs: List[PRDetails] = self.__load()

    def merged(self) -> List[PRDetails]:
        return [pr for pr in self.all_prs if pr.get("merged_at") is not None]

    def closed(self) -> List[PRDetails]:
        return [
            pr
            for pr in self.all_prs
            if pr.get("closed_at") is not None and pr.get("merged_at") is None
        ]

    def __pr_open_days(self, pr) -> int:
        """Return how many days the PR was open until merged."""
        created = datetime.fromisoformat(pr["created_at"].replace("Z", "+00:00"))
        # closed_at may be null for open PRs
        closed = pr.get("merged_at")
        if closed:
            closed = datetime.fromisoformat(closed.replace("Z", "+00:00"))
        else:
            # still open – use current UTC time
            closed = datetime.now(timezone.utc)

        return (closed - created).days

    def average_by_month(
        self, author: str | None = None, labels: str | None = None, prs=[]
    ) -> tuple[List[str], List[float]]:
        """Calculate average open days grouped by month.

        labels are comma-separated string.
        Matching is case-insensitive.
        """
        pr_months = {}

        all_prs = prs

        if labels:
            # normalize labels argument into a list of lowercase names
            labels_list = self.__normalize_labels(labels)
            all_prs = self.filter_prs_by_labels(all_prs, labels_list)

        print(f"Calculating average open days for {len(all_prs)} PRs")
        for pr in all_prs:
            if author and pr.get("user", {}).get("login", "").lower() != author.lower():
                continue
            created = datetime.fromisoformat(pr["created_at"].replace("Z", "+00:00"))
            month_key = created.strftime("%Y-%m")
            days = self.__pr_open_days(pr)
            pr_months.setdefault(month_key, []).append(days)

        months = sorted(pr_months.keys())
        avg_by_month = [sum(pr_months[m]) / len(pr_months[m]) for m in months]
        return months, avg_by_month

    def average_by_week(
        self, author: str | None = None, labels: str | None = None, prs=[]
    ) -> tuple[List[str], List[float]]:
        """Calculate average open days grouped by ISO week (YYYY-Www).

        labels may be None, or a comma-separated string.
        Matching is case-insensitive.
        """
        pr_weeks = {}

        all_prs = prs

        if labels:
            # normalize labels argument into a list of lowercase names (same logic as average_by_month)
            labels_list = self.__normalize_labels(labels)
            all_prs = self.filter_prs_by_labels(all_prs, labels_list)

        print(f"Calculating average open days for {len(all_prs)} PRs (by week)")
        for pr in all_prs:
            if author and pr.get("user", {}).get("login", "").lower() != author.lower():
                continue
            created = datetime.fromisoformat(pr["created_at"].replace("Z", "+00:00"))
            # isocalendar() may return a tuple; take year and week reliably
            iso = created.isocalendar()
            year = iso[0]
            week = iso[1]
            week_key = f"{year}-W{week:02d}"
            days = self.__pr_open_days(pr)
            pr_weeks.setdefault(week_key, []).append(days)

        weeks = sorted(pr_weeks.keys())
        avg_by_week = [sum(pr_weeks[w]) / len(pr_weeks[w]) for w in weeks]
        return weeks, avg_by_week

    def filter_prs_by_labels(
        self, prs: List[PRDetails], labels: Iterable[str]
    ) -> List[PRDetails]:
        labels_set = {label.lower() for label in (labels or [])}
        if not labels_set:
            return prs
        filtered: List[PRDetails] = []
        for pr in prs:
            pr_labels = pr.get("labels") or []
            names = {
                (label.get("name") or "").lower()
                for label in pr_labels
                if isinstance(label, dict)
            }
            if names & labels_set:
                filtered.append(pr)
        return filtered

    def __normalize_labels(self, labels: str | None) -> List[str]:
        # normalize labels argument into a list of lowercase names
        labels_list: List[str] = []
        if labels:
            if isinstance(labels, str):
                labels_list = [
                    label.strip().lower()
                    for label in labels.split(",")
                    if label.strip()
                ]
            else:
                labels_list = [str(label).strip().lower() for label in labels]
        return labels_list

    def get_unique_authors(self) -> List[str]:
        """Return a list of unique author names from the PRs."""
        authors = {pr.get("user", {}).get("login", "") for pr in self.all_prs}
        return sorted(author for author in authors if author)

    def prs_with_filters(self, filters=None) -> List[PRDetails]:
        if not filters:
            return self.all_prs

        start_date = filters.get("start_date")
        end_date = filters.get("end_date")

        filtered = self.all_prs
        if start_date and end_date:
            filtered = super().filter_by_date_range(filtered, start_date, end_date)

        authors = filters.get("authors")
        if authors:
            filtered_authors = []
            author_list = [a.strip().lower() for a in authors.split(",") if a.strip()]
            for pr in filtered:
                user = pr.get("user") or {}
                login = user.get("login") if isinstance(user, dict) else str(user)
                if not login:
                    login = "<unknown>"
                if login.lower() in author_list:
                    filtered_authors.append(pr)
            filtered = filtered_authors

        return filtered

    def get_unique_labels(self) -> List[LabelSummary]:
        labels_list = []
        labels_count: dict = {}
        for p in self.all_prs:
            pr_labels = p.get("labels") or []
            for lbl in pr_labels:
                if not isinstance(lbl, dict):
                    # fallback when labels are strings
                    name = str(lbl).strip().lower()
                else:
                    name = (lbl.get("name") or "").strip().lower()
                if not name:
                    continue
                labels_count[name] = labels_count.get(name, 0) + 1

        for label, count in labels_count.items():
            labels_list.append({"label_name": label, "prs_count": count})

        return labels_list

    def __load(self) -> List[PRDetails]:
        all_prs = []
        print("Loading PRs")
        contents = super().read_file_if_exists(self.file)

        if contents is None:
            print(f"No PRs file found at {self.file}. Please run fetch_prs first.")
            return all_prs

        all_prs = json.loads(contents)

        print(f"Loaded {len(all_prs)} PRs")
        print("Load complete.")

        for pr in all_prs:
            if pr.get("comments") is None:
                pr["comments"] = []

        contents = super().read_file_if_exists("prs_review_comments.json")

        if contents:
            all_prs_comment = json.loads(contents)
            if all_prs_comment:
                print("Associating PRs with comments")
                total = 1
                for pr in all_prs:
                    for comment in all_prs_comment:
                        if "pull_request_url" in comment and comment[
                            "pull_request_url"
                        ].endswith(f"/{pr['number']}"):
                            pr["comments"].append(comment)
                            total += 1
                print(f"Associated PRs with {total} comments")

        all_prs.sort(key=super().created_at_key_sort)

        return all_prs

    def __count_comments_before_merge(self, pr: dict) -> int:
        merged_at = pr.get("merged_at")
        if not merged_at:
            return 0
        try:
            merged_dt = datetime.fromisoformat(merged_at.replace("Z", "+00:00"))
        except Exception:
            return 0

        comments = pr.get("comments") or []
        cnt = 0
        for c in comments:
            c_created = c.get("created_at")
            if not c_created:
                continue
            try:
                c_dt = datetime.fromisoformat(c_created.replace("Z", "+00:00"))
            except Exception:
                continue
            if c_dt <= merged_dt:
                cnt += 1
        return cnt

    def average_comments(self, filters: None = None, aggregate_by: str = "week"):
        prs = self.prs_with_filters(filters=filters)

        merged_prs = prs

        if aggregate_by == "week":
            buckets: dict = {}
            for pr in merged_prs:
                try:
                    merged_dt = datetime.fromisoformat(
                        pr["merged_at"].replace("Z", "+00:00")
                    )
                except Exception:
                    continue
                iso = merged_dt.isocalendar()
                year = iso[0]
                week = iso[1]
                week_key = f"{year}-W{week:02d}"
                cnt = self.__count_comments_before_merge(pr)
                buckets.setdefault(week_key, []).append((cnt, merged_dt))

            weeks = sorted(buckets.keys())
            avg_vals = [
                sum([c for c, _ in buckets[w]]) / len(buckets[w]) for w in weeks
            ]

            # convert week keys to datetime (Monday of that ISO week)
            week_dates = []
            for wk in weeks:
                try:
                    parts = wk.split("-W")
                    y = int(parts[0])
                    w = int(parts[1])
                    wd = datetime.fromisocalendar(y, w, 1)
                    week_dates.append(wd)
                except Exception:
                    # fallback: try to parse as iso datetime string
                    try:
                        wd = datetime.fromisoformat(wk)
                        week_dates.append(wd)
                    except Exception:
                        continue

            x = [pd.to_datetime(dt) for dt in week_dates]
            y = avg_vals
            periods = weeks

        else:
            # aggregate by month
            buckets: dict = {}
            for pr in merged_prs:
                try:
                    merged_dt = datetime.fromisoformat(
                        pr["merged_at"].replace("Z", "+00:00")
                    )
                except Exception:
                    continue
                month_key = merged_dt.strftime("%Y-%m")
                cnt = self.__count_comments_before_merge(pr)
                buckets.setdefault(month_key, []).append((cnt, merged_dt))

            months = sorted(buckets.keys())
            avg_vals = [
                sum([c for c, _ in buckets[m]]) / len(buckets[m]) for m in months
            ]

            x = [pd.to_datetime(v) for v in months]
            y = avg_vals
            periods = months

        return {"x": x, "y": y, "period": periods}
