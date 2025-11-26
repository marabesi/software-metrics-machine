import click
import json

from software_metrics_machine.core.infrastructure.repository_factory import (
    create_prs_repository,
)
from software_metrics_machine.core.prs.plots.view_summary import PrViewSummary


@click.command(name="summary", help="View data information for pull requests")
@click.option(
    "--csv",
    type=str,
    default=None,
    help="Export summary as CSV to the given file path",
)
@click.option(
    "--start-date",
    type=str,
    default=None,
    help="Filter PRs created on or after this date (ISO 8601)",
)
@click.option(
    "--end-date",
    type=str,
    default=None,
    help="Filter PRs created on or before this date (ISO 8601)",
)
@click.option(
    "--labels",
    type=str,
    default=None,
    help="Comma-separated list of label names to filter PRs by (e.g. bug,enhancement)",
)
@click.option(
    "--output",
    type=str,
    default="text",
    help="Either 'text' or 'json' to specify the output format",
)
def summary(csv, start_date, end_date, output, labels):
    view = PrViewSummary(repository=create_prs_repository())
    result = view.main(
        csv=csv,
        start_date=start_date,
        end_date=end_date,
        output_format=output,
        labels=labels,
    )

    if output == "json":
        click.echo(json.dumps(result, indent=4))
        return

    parts = []
    parts.append("\nPRs Summary:\n")
    parts.append(f"Total PRs: {(result or {}).get('total_prs')}")
    parts.append(f"Merged PRs: {(result or {}).get('merged_prs')}")
    parts.append(f"Closed PRs: {(result or {}).get('closed_prs')}")
    parts.append(f"PRs Without Conclusion: {(result or {}).get('without_conclusion')}")
    parts.append(f"Unique Authors: {(result or {}).get('unique_authors')}")
    parts.append(f"Unique Labels: {(result or {}).get('unique_labels')}")
    parts.append(f"Average of comments per PR: {result.get('avg_comments_per_pr')}")

    parts.append("\nLabels:")
    labels = (result or {}).get("labels") or []
    for label in labels:
        name = label.get("label_name") if isinstance(label, dict) else str(label)
        count = label.get("prs_count") if isinstance(label, dict) else "?"
        parts.append(f"  - {name}: {count} PRs")

    parts.append("\nFirst PR:")
    first = (result or {}).get("first_pr") or {}
    parts.append(f"  Number: {first.get('number')}")
    parts.append(f"  Title: {first.get('title')}")
    parts.append(f"  Author: {first.get('login')}")
    parts.append(f"  Created: {first.get('created')}")
    parts.append(f"  Merged: {first.get('merged')}")
    parts.append(f"  Closed: {first.get('closed')}")

    parts.append("\nLast PR:")
    last = (result or {}).get("last_pr") or {}
    parts.append(f"  Number: {last.get('number')}")
    parts.append(f"  Title: {last.get('title')}")
    parts.append(f"  Author: {last.get('login')}")
    parts.append(f"  Created: {last.get('created')}")
    parts.append(f"  Merged: {last.get('merged')}")
    parts.append(f"  Closed: {last.get('closed')}")

    click.echo("\n".join(str(p) for p in parts))

    if csv:
        click.echo(f"Successfully exported data to {csv}")


command = summary
