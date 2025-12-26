import csv
from datetime import datetime
import statistics

from software_metrics_machine.core.prs.prs_repository import PrsRepository
from software_metrics_machine.core.prs.pr_types import (
    SummaryResult,
    PRDetails,
    PRFilters,
)


class PrViewSummary:
    def __init__(self, repository: PrsRepository):
        self.repository = repository

    def main(
        self,
        csv=None,
        start_date=None,
        end_date=None,
        output_format=None,
        labels: str | None = None,
        raw_filters: str | None = None,
    ) -> SummaryResult:
        self.csv = csv
        self.start_date = start_date
        self.end_date = end_date
        self.labels = labels
        filters: dict = {
            "start_date": self.start_date,
            "end_date": self.end_date,
            "labels": self.labels,
        }
        # merge any raw filters parsed by the repository
        self.filters: dict = {
            **filters,
            **self.repository.parse_raw_filters(raw_filters),
        }

        self.prs = self.repository.prs_with_filters(PRFilters(**self.filters))

        if len(self.prs) == 0:
            return {
                "avg_comments_per_pr": 0,
                "total_prs": 0,
                "merged_prs": 0,
                "closed_prs": 0,
                "without_conclusion": 0,
                "unique_authors": 0,
                "unique_labels": 0,
                "labels": [],
                "first_pr": {  # type: ignore
                    "number": None,
                    "title": None,
                    "login": None,
                    "created": None,
                    "merged": None,
                    "closed": None,
                },
                "last_pr": {  # type: ignore
                    "number": None,
                    "title": None,
                    "login": None,
                    "created": None,
                    "merged": None,
                    "closed": None,
                },
                "most_commented_pr": {},
                "top_commenter": {},
                "top_themes": {},  # type: ignore
                "first_comment_time_stats": {},
            }

        summary = self.__summarize_prs()

        if self.csv:
            self.__export_summary_to_csv(summary)

        structured_summary = self.__get_structured_summary(summary)

        return structured_summary

    def __export_summary_to_csv(self, summary):
        with open(self.csv, mode="w", newline="") as csv_file:
            writer = csv.writer(csv_file)
            writer.writerow(["Metric", "Value"])
            for metric, value in summary.items():
                writer.writerow([metric, value])
        # Return exported filename for callers that want confirmation
        return self.csv

    def __summarize_prs(self):
        summary = {}
        total = len(self.prs)
        summary["total_prs"] = total

        first = self.prs[0]
        last = self.prs[-1]
        summary["first_pr"] = first
        summary["last_pr"] = last

        merged = [p for p in self.prs if p.merged_at]
        closed = [p for p in self.prs if p.closed_at]
        without = [p for p in self.prs if not p.merged_at]

        summary["merged_prs"] = len(merged)
        summary["closed_prs"] = len(closed)
        summary["without_conclusion"] = len(without)

        summary["unique_authors"] = len(
            self.repository.get_unique_authors(self.filters)
        )

        labels_list = self.repository.get_unique_labels(self.filters)

        summary["labels"] = labels_list
        summary["unique_labels"] = len(labels_list)

        comments_count = self.repository.get_total_comments_count(self.filters)
        num_prs = len(self.prs)

        summary["avg_comments_per_pr"] = comments_count / num_prs

        summary["most_commented_pr"] = self.repository.get_most_commented_pr(
            self.filters
        )

        summary["top_commenter"] = self.repository.get_top_commenter(self.filters)

        summary["top_themes"] = self.repository.get_top_themes(self.filters)

        # Time to first comment: compute, in hours, per PR that has at least one comment
        first_comment_deltas_hours = []
        prs_with_no_comments = 0
        for p in self.prs:
            try:
                created = datetime.fromisoformat(p.created_at.replace("Z", "+00:00"))
            except Exception:
                # If parsing fails, consider as no comment data available
                prs_with_no_comments += 1
                continue

            # Find earliest comment for this PR
            if not getattr(p, "comments", None):
                prs_with_no_comments += 1
                continue

            comment_times = []
            for c in p.comments:
                c_created = getattr(c, "created_at", None)
                if not c_created:
                    continue
                try:
                    c_dt = datetime.fromisoformat(c_created.replace("Z", "+00:00"))
                    comment_times.append(c_dt)
                except Exception:
                    continue

            if not comment_times:
                prs_with_no_comments += 1
                continue

            first_comment = min(comment_times)
            delta = first_comment - created
            # convert to hours
            delta_hours = delta.total_seconds() / 3600.0
            # only consider non-negative deltas
            if delta_hours >= 0:
                first_comment_deltas_hours.append(delta_hours)

        if first_comment_deltas_hours:
            summary["first_comment_time_stats"] = {
                "avg_hours": round(statistics.mean(first_comment_deltas_hours), 2),
                "median_hours": round(statistics.median(first_comment_deltas_hours), 2),
                "min_hours": round(min(first_comment_deltas_hours), 2),
                "max_hours": round(max(first_comment_deltas_hours), 2),
                "prs_with_comment": len(first_comment_deltas_hours),
                "prs_without_comment": prs_with_no_comments,
            }
        else:
            summary["first_comment_time_stats"] = {
                "avg_hours": None,
                "median_hours": None,
                "min_hours": None,
                "max_hours": None,
                "prs_with_comment": 0,
                "prs_without_comment": prs_with_no_comments,
            }

        return summary

    def __get_structured_summary(self, summary) -> SummaryResult:
        structured_summary = SummaryResult(
            **{
                "avg_comments_per_pr": summary.get("avg_comments_per_pr", 0),
                "total_prs": summary.get("total_prs", 0),
                "merged_prs": summary.get("merged_prs", 0),
                "closed_prs": summary.get("closed_prs", 0),
                "without_conclusion": summary.get("without_conclusion", 0),
                "unique_authors": summary.get("unique_authors", 0),
                "unique_labels": summary.get("unique_labels", 0),
                "labels": summary.get("labels", []),
                "first_pr": self.__brief_pr(summary.get("first_pr")),
                "last_pr": self.__brief_pr(summary.get("last_pr")),
                "most_commented_pr": summary.get("most_commented_pr", {}),
                "top_commenter": summary.get("top_commenter", {}),
                "top_themes": summary.get("top_themes", []),
                "first_comment_time_stats": summary.get("first_comment_time_stats", {}),
            }
        )
        return structured_summary

    def __brief_pr(self, pr: PRDetails) -> PRDetails:
        number = pr.number
        title = pr.title
        login = pr.user.login
        created = pr.created_at
        merged = pr.merged_at or None
        closed = pr.closed_at or None

        return {  # type: ignore
            "number": number,
            "title": title,
            "login": login,
            "created": created,
            "merged": merged,
            "closed": closed,
        }

    def print_text_summary(self, structured_summary):
        # This helper used to print text; keep it for callers that want a
        # textual representation, but return the string instead of printing.
        lines = []
        lines.append("\nPRs Summary:\n")
        lines.append(
            f"Average of comments per PR: {structured_summary['avg_comments_per_pr']}"
        )
        lines.append(f"Total PRs: {structured_summary['total_prs']}")
        lines.append(f"Merged PRs: {structured_summary['merged_prs']}")
        lines.append(f"Closed PRs: {structured_summary['closed_prs']}")
        lines.append(
            f"PRs Without Conclusion: {structured_summary['without_conclusion']}"
        )
        lines.append(f"Unique Authors: {structured_summary['unique_authors']}")
        lines.append(f"Unique Labels: {structured_summary['unique_labels']}")

        lines.append("\nLabels:")
        for label in structured_summary["labels"]:
            lines.append(f"  - {label['label_name']}: {label['prs_count']} PRs")

        lines.append("\nFirst PR:")
        first_pr = structured_summary["first_pr"]
        lines.append(f"  Number: {first_pr['number']}")
        lines.append(f"  Title: {first_pr['title']}")
        lines.append(f"  Author: {first_pr['login']}")
        lines.append(f"  Created: {first_pr['created']}")
        lines.append(f"  Merged: {first_pr['merged']}")
        lines.append(f"  Closed: {first_pr['closed']}")

        lines.append("\nLast PR:")
        last_pr = structured_summary["last_pr"]
        lines.append(f"  Number: {last_pr['number']}")
        lines.append(f"  Title: {last_pr['title']}")
        lines.append(f"  Author: {last_pr['login']}")
        lines.append(f"  Created: {last_pr['created']}")
        lines.append(f"  Merged: {last_pr['merged']}")
        lines.append(f"  Closed: {last_pr['closed']}")

        top = structured_summary.get("top_commenter") or {}
        lines.append("\nTop commenter:")
        lines.append(f"  Login: {top.get('login')}")
        lines.append(f"  Comments: {top.get('comments_count')}")

        lines.append("\nTop themes:")
        for theme in structured_summary.get("top_themes", []):
            lines.append(f"  - {theme.get('theme')}: {theme.get('count')}")

        # Time to first comment stats
        fstats = structured_summary.get("first_comment_time_stats") or {}
        lines.append("\nTime to first comment (hours):")
        lines.append(f"  Average: {fstats.get('avg_hours')}")
        lines.append(f"  Median: {fstats.get('median_hours')}")
        lines.append(f"  Min: {fstats.get('min_hours')}")
        lines.append(f"  Max: {fstats.get('max_hours')}")
        lines.append(f"  PRs with comment: {fstats.get('prs_with_comment')}")
        lines.append(f"  PRs without comment: {fstats.get('prs_without_comment')}")

        return "\n".join(lines)
