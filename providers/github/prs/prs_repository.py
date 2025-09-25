import json
from typing import List, Iterable
from datetime import datetime, timezone
from infrastructure.base_repository import BaseRepository
from infrastructure.configuration.configuration import Configuration
from providers.github.prs.types import LabelSummary


class LoadPrs(BaseRepository):
    def __init__(self, configuration: Configuration):
        super().__init__(configuration=configuration)
        self.file = "prs.json"
        self.all_prs = []
        self.all_prs = self.__load()

    def merged(self):
        return [pr for pr in self.all_prs if pr.get("merged_at") is not None]

    def closed(self):
        return [
            pr
            for pr in self.all_prs
            if pr.get("closed_at") is not None and pr.get("merged_at") is None
        ]

    def __pr_open_days(self, pr):
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
    ):
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
    ):
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
        self, prs: List[dict], labels: Iterable[str]
    ) -> List[dict]:
        labels_set = {label.lower() for label in (labels or [])}
        if not labels_set:
            return prs
        filtered: List[dict] = []
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

    def prs_with_filters(self, filters=None):
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

    def __load(self):
        all_prs = []
        print("Loading PRs")
        contents = super().read_file_if_exists(self.file)

        if contents is None:
            print(f"No PRs file found at {self.file}. Please run fetch_prs first.")
            return all_prs

        all_prs = json.loads(contents)

        print(f"Loaded {len(all_prs)} PRs")
        print("Load complete.")

        all_prs.sort(key=super().created_at_key_sort)

        return all_prs
