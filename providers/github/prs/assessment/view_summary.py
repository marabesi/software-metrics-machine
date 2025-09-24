import json

from providers.github.prs.prs_repository import LoadPrs
from datetime import datetime, timezone


class PrViewSummary:
    def __init__(self, repository: LoadPrs):
        self.prs = repository.all_prs

    def main(self, csv=None, start_date=None, end_date=None, output_format=None):
        """
        Execute the logic for the PRs summarize command.

        Args:
            csv (str): Path to export summary as CSV.
            start_date (str): Start date for filtering PRs.
            end_date (str): End date for filtering PRs.
            output_format (str): Format of the output, either 'text' or 'json'.

        Returns:
            dict: The structured summary if output_format is not provided.
        """
        self.csv = csv
        self.start_date = start_date
        self.end_date = end_date

        # Apply date filtering
        if self.start_date or self.end_date:
            self.prs = self.__filter_prs_by_date()

        summary = self.__summarize_prs()

        if self.csv:
            print(f"Exporting summary to {self.csv}...")
            self.__export_summary_to_csv(summary)
            return

        structured_summary = self.__get_structured_summary(summary)

        if output_format == "text":
            print(structured_summary)
            return

        if output_format == "json":
            print(json.dumps(structured_summary, indent=4))
            return

        return structured_summary

    def __filter_prs_by_date(self):
        start = (
            datetime.fromisoformat(self.start_date).replace(tzinfo=timezone.utc)
            if self.start_date
            else None
        )
        end = (
            datetime.fromisoformat(self.end_date).replace(tzinfo=timezone.utc)
            if self.end_date
            else None
        )

        filtered = self.prs.filter_by_date_range(self.prs, start, end)

        return filtered

    def __export_summary_to_csv(self, summary):
        """
        Export the summary to a CSV file.

        Args:
            summary (list): Summary data.
            file_path (str): Path to the CSV file.
        """
        import csv

        with open(self.csv, mode="w", newline="") as csv_file:
            writer = csv.writer(csv_file)
            writer.writerow(["Metric", "Value"])
            for metric, value in summary.items():
                writer.writerow([metric, value])

    def __summarize_prs(self):
        """
        Summarize the PRs.
        """
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

    def __get_structured_summary(self, summary):
        """
        Create a structured summary object.
        """
        structured_summary = {
            "total_prs": summary.get("total_prs", 0),
            "merged_prs": summary.get("merged_prs", 0),
            "closed_prs": summary.get("closed_prs", 0),
            "without_conclusion": summary.get("without_conclusion", 0),
            "unique_authors": summary.get("unique_authors", 0),
            "unique_labels": summary.get("unique_labels", 0),
            "labels": summary.get("labels", {}),
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
