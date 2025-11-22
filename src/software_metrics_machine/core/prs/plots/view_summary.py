import csv

from software_metrics_machine.core.prs.prs_repository import PrsRepository
from software_metrics_machine.core.prs.pr_types import SummaryResult, PRDetails


class PrViewSummary:
    def __init__(self, repository: PrsRepository):
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

        if len(self.prs) == 0:
            # No PRs to summarize; return an empty structured summary
            return {
                "total_prs": 0,
                "merged_prs": 0,
                "closed_prs": 0,
                "without_conclusion": 0,
                "unique_authors": 0,
                "unique_labels": 0,
                "labels": [],
                "first_pr": {
                    "number": None,
                    "title": None,
                    "login": None,
                    "created": None,
                    "merged": None,
                    "closed": None,
                },
                "last_pr": {
                    "number": None,
                    "title": None,
                    "login": None,
                    "created": None,
                    "merged": None,
                    "closed": None,
                },
            }

        summary = self.__summarize_prs()

        # Export CSV if requested (write to file), return structured data always
        if self.csv:
            self.__export_summary_to_csv(summary)

        structured_summary = self.__get_structured_summary(summary)

        # For backward compatibility, preserve output_format options by returning
        # the structured summary. The caller can format as needed (text/json/etc.).
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

        summary["unique_authors"] = len(self.repository.get_unique_authors())

        labels_list = self.repository.get_unique_labels()

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

    def __brief_pr(self, pr: PRDetails) -> str:
        number = pr.number
        title = pr.title
        login = pr.user.login
        created = pr.created_at
        merged = pr.merged_at or None
        closed = pr.closed_at or None

        return {
            "number": number,
            "title": title,
            "login": login,
            "created": created,
            "merged": merged,
            "closed": closed,
        }

    def print_text_summary(self, structured_summary):
        """
        Print the structured summary in a readable text format.

        Args:
            structured_summary (dict): The structured summary object.
        """
        # This helper used to print text; keep it for callers that want a
        # textual representation, but return the string instead of printing.
        lines = []
        lines.append("\nPRs Summary:\n")
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

        return "\n".join(lines)
