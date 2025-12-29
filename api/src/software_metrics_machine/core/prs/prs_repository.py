import json
import re
from typing import Counter, List, Iterable, Optional, Dict, Tuple
from datetime import datetime, timezone
from pydantic import TypeAdapter

from software_metrics_machine.core.infrastructure.pandas import pd
from software_metrics_machine.core.infrastructure.file_system_base_repository import (
    FileSystemBaseRepository,
)
from software_metrics_machine.core.infrastructure.configuration.configuration import (
    Configuration,
)
from software_metrics_machine.core.infrastructure.logger import Logger
from software_metrics_machine.core.prs.pr_types import (
    LabelSummary,
    PRDetails,
    PRComments,
    PRFilters,
)
from software_metrics_machine.core.stop_words import STOPWORDS


class PrsRepository(FileSystemBaseRepository):
    def __init__(self, configuration: Configuration):
        super().__init__(configuration=configuration, target_subfolder="github")
        self.logger = Logger(configuration=configuration).get_logger()
        self.file = "prs.json"
        self.all_prs: List[PRDetails] = []
        self.__load()

    def merged(self) -> List[PRDetails]:
        return [pr for pr in self.all_prs if pr.merged_at is not None]

    def closed(self) -> List[PRDetails]:
        return [
            pr
            for pr in self.all_prs
            if pr.closed_at is not None and pr.merged_at is None
        ]

    def __pr_open_days(self, pr: PRDetails) -> int:
        created = datetime.fromisoformat(pr.created_at.replace("Z", "+00:00"))
        closed = pr.merged_at
        if closed:
            closed_at = datetime.fromisoformat(closed.replace("Z", "+00:00"))
        else:
            # still open – use current UTC time
            closed_at = datetime.now(timezone.utc)

        return (closed_at - created).days

    def average_by(
        self, by: str, labels: str | None = None, prs: List[PRDetails] = []
    ) -> tuple[List[str], List[float]]:
        if by == "month":
            return self.__average_by_month(labels=labels, prs=prs)
        elif by == "week":
            return self.__average_by_week(labels=labels, prs=prs)
        else:
            raise ValueError(f"Unsupported 'by' value: {by}")

    def __average_by_month(
        self, labels: str | None = None, prs=[]
    ) -> tuple[List[str], List[float]]:
        pr_months: Dict[str, List[int]] = {}

        all_prs = prs

        if labels:
            # normalize labels argument into a list of lowercase names
            labels_list = self.__normalize_labels(labels)
            all_prs = self.filter_prs_by_labels(all_prs, labels_list)

        self.logger.debug(f"Calculating average open days for {len(all_prs)} PRs")
        for pr in all_prs:
            created = datetime.fromisoformat(pr.created_at.replace("Z", "+00:00"))
            month_key = created.strftime("%Y-%m")
            days = self.__pr_open_days(pr)
            pr_months.setdefault(month_key, []).append(days)

        months = sorted(pr_months.keys())
        avg_by_month = [sum(pr_months[m]) / len(pr_months[m]) for m in months]
        return months, avg_by_month

    def __average_by_week(
        self, labels: str | None = None, prs=[]
    ) -> tuple[List[str], List[float]]:
        pr_weeks: Dict[str, List[int]] = {}

        all_prs = prs

        if labels:
            # normalize labels argument into a list of lowercase names (same logic as average_by_month)
            labels_list = self.__normalize_labels(labels)
            all_prs = self.filter_prs_by_labels(all_prs, labels_list)

        self.logger.debug(
            f"Calculating average open days for {len(all_prs)} PRs (by week)"
        )
        for pr in all_prs:
            if pr.merged_at is None:
                continue
            created = datetime.fromisoformat(pr.created_at.replace("Z", "+00:00"))
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
            pr_labels = pr.labels
            names = {label.name.lower() for label in pr_labels}
            if names & labels_set:
                filtered.append(pr)
        return filtered

    def get_unique_authors(self, filters: Optional[PRFilters] = None) -> List[str]:
        authors = {pr.user.login for pr in self.prs_with_filters(filters=filters)}
        return sorted(author for author in authors if author)

    def prs_with_filters(self, filters: Optional[PRFilters] = None) -> List[PRDetails]:
        if not filters:
            return self.all_prs

        raw_filters = filters.get("raw_filters")
        if raw_filters:
            parsed = super().parse_raw_filters(raw_filters)
            filters = {**filters, **parsed}

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
                user = pr.user
                login = user.login
                if login.lower() in author_list:
                    filtered_authors.append(pr)
            filtered = filtered_authors

        labels = filters.get("labels")
        if labels:
            labels_list = self.__normalize_labels(labels)
            filtered = self.filter_prs_by_labels(filtered, labels_list)

        state = filters.get("state")

        if state:
            filtered = [pr for pr in filtered if pr.state == state]

        self.logger.debug(f"Filtered PRs count: {len(filtered)}")
        return filtered

    def get_unique_labels(
        self, filters: Optional[PRFilters] = None
    ) -> List[LabelSummary]:
        labels_list: List[LabelSummary] = []
        labels_count: dict = {}
        for p in self.prs_with_filters(filters=filters):
            pr_labels = p.labels
            for lbl in pr_labels:
                name = lbl.name.strip().lower()
                labels_count[name] = labels_count.get(name, 0) + 1

        for label, count in labels_count.items():
            labels_list.append({"label_name": label, "prs_count": count})

        return labels_list

    def get_total_comments_count(self, filters: Optional[PRFilters] = None) -> int:
        total_comments = 0
        for pr in self.prs_with_filters(filters=filters):
            total_comments += len(pr.comments)
        return total_comments

    def average_comments(
        self, filters: PRFilters | None = None, aggregate_by: str = "week"
    ):
        prs = self.prs_with_filters(filters=filters)

        merged_prs = prs

        if aggregate_by == "week":
            week_buckets: Dict[str, List[Tuple[int, datetime]]] = {}
            for pr in merged_prs:
                if not pr.merged_at:
                    continue
                merged_dt = datetime.fromisoformat(pr.merged_at.replace("Z", "+00:00"))
                iso = merged_dt.isocalendar()
                year = iso[0]
                week = iso[1]
                week_key = f"{year}-W{week:02d}"
                cnt = self.__count_comments_before_merge(pr)
                week_buckets.setdefault(week_key, []).append((cnt, merged_dt))

            weeks = sorted(week_buckets.keys())
            avg_vals = [
                sum([c for c, _ in week_buckets[w]]) / len(week_buckets[w])
                for w in weeks
            ]

            # convert week keys to datetime (Monday of that ISO week)
            week_dates = []
            for wk in weeks:
                try:
                    parts = wk.split("-W")
                    y_part = int(parts[0])
                    w_part = int(parts[1])
                    wd = datetime.fromisocalendar(y_part, w_part, 1)
                    week_dates.append(wd)
                except Exception:
                    # fallback: try to parse as iso datetime string
                    try:
                        wd = datetime.fromisoformat(wk)
                        week_dates.append(wd)
                    except Exception:
                        continue

            x: List[pd.Timestamp] = [pd.to_datetime(dt) for dt in week_dates]
            y: List[float] = avg_vals
            periods = weeks
        else:
            # aggregate by month
            month_buckets: Dict[str, List[Tuple[int, datetime]]] = {}

            for pr in merged_prs:
                if pr.merged_at is None:
                    continue

                merged_dt = datetime.fromisoformat(pr.merged_at.replace("Z", "+00:00"))
                month_key = merged_dt.strftime("%Y-%m")
                cnt = self.__count_comments_before_merge(pr)
                month_buckets.setdefault(month_key, []).append((cnt, merged_dt))

            months = sorted(month_buckets.keys())
            avg_vals = [
                sum([c for c, _ in month_buckets[m]]) / len(month_buckets[m])
                for m in months
            ]

            x = [pd.to_datetime(v) for v in months]
            y = avg_vals
            periods = months

        return {"x": x, "y": y, "period": periods}

    def __load(self) -> None:
        self.logger.debug("Loading PRs")
        contents = super().read_file_if_exists(self.file)

        if contents is None:
            self.logger.debug(
                f"No PRs file found at {self.file}. Please run fetch_prs first."
            )
            return

        list_adapter_prs = TypeAdapter(list[PRDetails])
        self.all_prs = list_adapter_prs.validate_json(contents)

        self.logger.debug(f"Loaded {len(self.all_prs)} PRs")

        contents_comments = super().read_file_if_exists("prs_review_comments.json")

        if contents_comments:
            all_prs_comment = json.loads(contents_comments)
            if all_prs_comment:
                self.logger.debug("Associating PRs with comments")
                total = 0
                for pr in self.all_prs:
                    for comment in all_prs_comment:
                        if "pull_request_url" in comment and comment[
                            "pull_request_url"
                        ].endswith(f"/{pr.number}"):
                            pr.comments.append(PRComments(**comment))
                            total += 1
                self.logger.debug(f"Associated PRs with {total} comments")

        self.all_prs.sort(key=super().created_at_key_sort)

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

    def get_most_commented_pr(self, filters: Optional[PRFilters] = None) -> dict:
        most_commented = None
        most_comments_count = 0
        for p in self.prs_with_filters(filters=filters):
            cnt = len(p.comments) if getattr(p, "comments", None) is not None else 0
            if cnt > most_comments_count:
                most_comments_count = cnt
                most_commented = p

        if most_commented:
            return {
                "number": most_commented.number,
                "title": most_commented.title,
                "login": most_commented.user.login,
                "comments_count": most_comments_count,
            }
        else:
            return {
                "number": None,
                "title": None,
                "login": None,
                "comments_count": 0,
            }

    def get_top_commenter(self, filters: Optional[PRFilters] = None) -> dict:
        commenter_counts: dict = {}
        for p in self.prs_with_filters(filters=filters):
            for c in getattr(p, "comments", []) or []:
                user = getattr(c, "user", None)
                if user and getattr(user, "login", None):
                    login = user.login
                    commenter_counts[login] = commenter_counts.get(login, 0) + 1

        top_commenter = None
        top_commenter_count = 0
        for login, cnt in commenter_counts.items():
            if cnt > top_commenter_count:
                top_commenter_count = cnt
                top_commenter = login

        if top_commenter:
            return {
                "login": top_commenter,
                "comments_count": top_commenter_count,
            }

        return {"login": None, "comments_count": 0}

    def get_top_themes(self, filters: Optional[PRFilters] = None) -> List[dict]:
        word_counts: Counter[str] = Counter()
        for p in self.prs_with_filters(filters=filters):
            for c in getattr(p, "comments", []) or []:
                body = getattr(c, "body", "") or ""
                tokens = re.findall(r"\w+", body.lower())
                for t in tokens:
                    if len(t) <= 2:
                        continue
                    if t in STOPWORDS:
                        continue
                    word_counts[t] += 1

        top_themes = []
        if word_counts:
            for theme, cnt in word_counts.most_common(5):
                top_themes.append({"theme": theme, "count": cnt})

        return top_themes

    def __count_comments_before_merge(self, pr: PRDetails) -> int:
        merged_at = pr.merged_at
        if not merged_at:
            return 0
        try:
            merged_dt = datetime.fromisoformat(merged_at.replace("Z", "+00:00"))
        except Exception:
            return 0

        comments = pr.comments
        cnt = 0
        for c in comments:
            c_created = c.created_at
            if not c_created:
                continue
            try:
                c_dt = datetime.fromisoformat(c_created.replace("Z", "+00:00"))
            except Exception:
                continue
            if c_dt <= merged_dt:
                cnt += 1
        return cnt
