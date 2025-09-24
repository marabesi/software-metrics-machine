import json
import csv
from typing import TypedDict, List, Union

from providers.github.prs.prs_repository import LoadPrs


class LabelSummary(TypedDict):
    label_name: str
    prs_count: int


class PRDetails(TypedDict):
    number: Union[str, None]
    title: Union[str, None]
    login: Union[str, None]
    created: Union[str, None]
    merged: Union[str, None]
    closed: Union[str, None]


class SummaryResult(TypedDict):
    total_prs: int
    merged_prs: int
    closed_prs: int
    without_conclusion: int
    unique_authors: int
    unique_labels: int
    labels: List[LabelSummary]
    first_pr: PRDetails
    last_pr: PRDetails


class PrViewSummary:
    def __init__(self, repository: LoadPrs):
        self.repository = repository
        self.prs = repository.all_prs

    def main(
        self, csv=None, start_date=None, end_date=None, output_format=None
    ) -> SummaryResult | None:
        self.csv = csv
        self.start_date = start_date
        self.end_date = end_date

        self.prs = self.repository.prs_with_filters(
            {"start_date": self.start_date, "end_date": self.end_date}
        )

        summary = self.__summarize_prs()

        if self.csv:
            print(f"Exporting summary to {self.csv}...")
            self.__export_summary_to_csv(summary)
        else:
            structured_summary = self.__get_structured_summary(summary)
            if output_format == "text":
                self.__print_text_summary(structured_summary)
            elif output_format == "json":
                print(json.dumps(structured_summary, indent=4))
            else:
                return structured_summary

    def __export_summary_to_csv(self, summary):
        with open(self.csv, mode="w", newline="") as csv_file:
            writer = csv.writer(csv_file)
            writer.writerow(["Metric", "Value"])
            for metric, value in summary.items():
                writer.writerow([metric, value])

    def __summarize_prs(self):
        summary = {}
        total = len(self.prs)
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
                    "unique_labels": 0,
                    "labels": [],
                }
            )
            return summary

        # first and last based on the loaded order
        first = self.prs[0]
        last = self.prs[-1]
        summary["first_pr"] = first
        summary["last_pr"] = last

        merged = [p for p in self.prs if p.get("merged_at")]
        closed = [p for p in self.prs if p.get("closed_at") and not p.get("merged_at")]
        without = [
            p for p in self.prs if not p.get("closed_at") and not p.get("merged_at")
        ]

        summary["merged_prs"] = len(merged)
        summary["closed_prs"] = len(closed)
        summary["without_conclusion"] = len(without)

        # count unique authors (use login when available)
        authors = set()
        for p in self.prs:
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

        # aggregate labels used across all PRs and count occurrences
        labels_list = []
        labels_count: dict = {}
        for p in self.prs:
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

        summary["labels"] = labels_list
        summary["unique_labels"] = len(labels_list)
        return summary

    def __get_structured_summary(self, summary) -> SummaryResult:
        structured_summary = {
            "total_prs": summary.get("total_prs", 0),
            "merged_prs": summary.get("merged_prs", 0),
            "closed_prs": summary.get("closed_prs", 0),
            "without_conclusion": summary.get("without_conclusion", 0),
            "unique_authors": summary.get("unique_authors", 0),
            "unique_labels": summary.get("unique_labels", 0),
            "labels": summary.get("labels", []),
            "first_pr": self.__brief_pr(summary.get("first_pr")),
            "last_pr": self.__brief_pr(summary.get("last_pr")),
        }
        return structured_summary

    def __brief_pr(self, pr: dict) -> str:
        if not pr:
            return "<none>"
        number = pr.get("number") or pr.get("id") or "?"
        title = pr.get("title") or "<no title>"
        user = pr.get("user") or {}
        login = (
            user.get("login") if isinstance(user, dict) else str(user)
        ) or "<unknown>"
        created = pr.get("created_at") or None
        merged = pr.get("merged_at") or None
        closed = pr.get("closed_at") or None

        return {
            "number": number,
            "title": title,
            "login": login,
            "created": created,
            "merged": merged,
            "closed": closed,
        }

    def __print_text_summary(self, structured_summary):
        """
        Print the structured summary in a readable text format.

        Args:
            structured_summary (dict): The structured summary object.
        """
        print("\nPRs Summary:\n")
        print(f"Total PRs: {structured_summary['total_prs']}")
        print(f"Merged PRs: {structured_summary['merged_prs']}")
        print(f"Closed PRs: {structured_summary['closed_prs']}")
        print(f"PRs Without Conclusion: {structured_summary['without_conclusion']}")
        print(f"Unique Authors: {structured_summary['unique_authors']}")
        print(f"Unique Labels: {structured_summary['unique_labels']}")

        print("\nLabels:")
        for label in structured_summary["labels"]:
            print(f"  - {label['label_name']}: {label['prs_count']} PRs")

        print("\nFirst PR:")
        first_pr = structured_summary["first_pr"]
        print(f"  Number: {first_pr['number']}")
        print(f"  Title: {first_pr['title']}")
        print(f"  Author: {first_pr['login']}")
        print(f"  Created: {first_pr['created']}")
        print(f"  Merged: {first_pr['merged']}")
        print(f"  Closed: {first_pr['closed']}")

        print("\nLast PR:")
        last_pr = structured_summary["last_pr"]
        print(f"  Number: {last_pr['number']}")
        print(f"  Title: {last_pr['title']}")
        print(f"  Author: {last_pr['login']}")
        print(f"  Created: {last_pr['created']}")
        print(f"  Merged: {last_pr['merged']}")
        print(f"  Closed: {last_pr['closed']}")
