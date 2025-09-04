import json
from typing import List, Iterable
from datetime import datetime, timezone
from infrastructure.base_repository import BaseRepository
from infrastructure.configuration import Configuration

class LoadPrs(BaseRepository):
    def __init__(self):
        super().__init__(configuration=Configuration())
        self.file = super().default_path_for("prs.json")
        self.all_prs = []
        self.all_prs = self.__load()

    def __load(self):
        all_prs = []
        print(f"Loading PRs")

        with open(self.file, 'r') as f:
            all_prs = json.load(f)

        print(f"Loaded {len(all_prs)} PRs")
        print("Load complete.")

        first_pr = all_prs[0]
        last_pr = all_prs[-1]
        print(f"  → first PR {first_pr['created_at']} last PR {last_pr['created_at']} ")
        return all_prs

    def merged(self):
        return [pr for pr in self.all_prs if pr.get("merged_at") is not None]

    def closed(self):
        return [pr for pr in self.all_prs if pr.get("closed_at") is not None and pr.get("merged_at") is None]

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

    def average_by_month(self, author: str | None = None, labels: Iterable[str] | str | None = None):
        """Calculate average open days grouped by month.

        labels may be None, a list/iterable of label names, or a comma-separated string.
        Matching is case-insensitive.
        """
        pr_months = {}

        all_prs = self.all_prs

        # normalize labels argument into a list of lowercase names
        labels_list: List[str] = []
        if labels:
            if isinstance(labels, str):
                labels_list = [l.strip().lower() for l in labels.split(",") if l.strip()]
            else:
                labels_list = [str(l).strip().lower() for l in labels]

        if labels_list:
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
        avg_by_month = [sum(pr_months[m])/len(pr_months[m]) for m in months]
        return months, avg_by_month

    def filter_prs_by_labels(self, prs: List[dict], labels: Iterable[str]) -> List[dict]:
        labels_set = {l.lower() for l in (labels or [])}
        if not labels_set:
            return prs
        filtered: List[dict] = []
        for pr in prs:
            pr_labels = pr.get("labels") or []
            names = {(l.get("name") or "").lower() for l in pr_labels if isinstance(l, dict)}
            if names & labels_set:
                filtered.append(pr)
        return filtered
