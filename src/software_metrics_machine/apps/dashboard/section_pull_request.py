import pandas as pd
import panel as pn
from software_metrics_machine.apps.dashboard.components.tabulator import (
    TabulatorComponent,
)
from software_metrics_machine.core.prs.plots.view_average_comments_per_pr import (
    ViewAverageCommentsPerPullRequest,
)
from software_metrics_machine.core.prs.plots.view_average_of_prs_open_by import (
    ViewAverageOfPrsOpenBy,
)
from software_metrics_machine.core.prs.plots.view_average_review_time_by_author import (
    ViewAverageReviewTimeByAuthor,
)
from software_metrics_machine.core.prs.plots.view_open_prs_through_time import (
    ViewOpenPrsThroughTime,
)
from software_metrics_machine.core.prs.plots.view_prs_by_author import (
    ViewPrsByAuthor,
)

from software_metrics_machine.core.prs.prs_repository import PrsRepository

pn.extension("tabulator")


def prs_section(
    date_range_picker, author_select, label_selector, repository: PrsRepository
):
    def normalize_label(selected_labels):
        if len(selected_labels) == 0:
            return None
        return ",".join(selected_labels)

    def normalize_authors(author_select):
        if len(author_select) == 0:
            return None
        return ",".join(author_select)

    def plot_average_prs_open_by(
        date_range_picker, selected_labels, author_select, aggregate_by_select
    ):
        return (
            ViewAverageOfPrsOpenBy(repository=repository)
            .main(
                start_date=date_range_picker[0],
                end_date=date_range_picker[1],
                labels=normalize_label(selected_labels),
                authors=normalize_authors(author_select),
                aggregate_by=aggregate_by_select,
            )
            .plot
        )

    def plot_average_review_time_by_author(
        date_range_picker, selected_labels, author_select
    ):
        return (
            ViewAverageReviewTimeByAuthor(repository=repository)
            .plot_average_open_time(
                title="Average Review Time By Author",
                start_date=date_range_picker[0],
                end_date=date_range_picker[1],
                labels=normalize_label(selected_labels),
                authors=normalize_authors(author_select),
            )
            .plot
        )

    def plot_average_pr_comments(date_range_picker, selected_labels, author_select):
        return (
            ViewAverageCommentsPerPullRequest(repository=repository)
            .main(
                start_date=date_range_picker[0],
                end_date=date_range_picker[1],
                labels=normalize_label(selected_labels),
                authors=normalize_authors(author_select),
            )
            .plot
        )

    def plot_prs_through_time(date_range_picker, author_select):
        return (
            ViewOpenPrsThroughTime(repository=repository)
            .main(
                start_date=date_range_picker[0],
                end_date=date_range_picker[1],
                title="",
                authors=normalize_authors(author_select),
            )
            .plot
        )

    def plot_prs_by_author(date_range_picker, selected_labels):
        return (
            ViewPrsByAuthor(repository=repository)
            .plot_top_authors(
                title="PRs By Author",
                start_date=date_range_picker[0],
                end_date=date_range_picker[1],
                labels=normalize_label(selected_labels),
            )
            .plot
        )

    aggregate_by_select = pn.widgets.Select(
        name="Aggregate By", options=["week", "month"], value="week"
    )
    views = pn.Column(
        "## Pull requests",
        """
            A pull request is a request to merge a set of proposed changes into a codebase. It's the most common way
            developers propose, review, and discuss code before it becomes part of the main project.
        """,
        pn.layout.Divider(),
        pn.Row(
            pn.Column(
                "### Open PRs Through Time",
                pn.pane.HTML(
                    """
                <details style="cursor: pointer;">
                    <summary>
                        This view visualizes pull request activity through time by counting how many PRs
                        were opened and how many were closed on each date
                    </summary>
                    <div>
                        <br />
                        Its primary goals are:
                        <ol>
                            <li>Give a quick, date-by-date view of activity (opened vs closed).</li>
                            <li>Let you compare opened vs closed on the same date (stacked bars show both).</li>
                            <li>Surface short-term spikes (bursts of opens or closes) and persistence of activity.</li>
                        </ol>

                        It is not a running total of open PRs — it reports per-day event counts. If you need the number
                        of PRs open on each date, you'd add a cumulative line (opened - closed over time).
                    </div>
                </details>
                    """,
                    sizing_mode="stretch_width",
                ),
                pn.panel(
                    pn.bind(
                        plot_prs_through_time,
                        date_range_picker.param.value,
                        author_select.param.value,
                    ),
                    sizing_mode="stretch_width",
                ),
                sizing_mode="stretch_width",
            ),
            sizing_mode="stretch_width",
        ),
        pn.Row(
            pn.Column(
                "### Average PRs Open",
                pn.pane.HTML(
                    """
                <details style="cursor: pointer;">
                    <summary>
                    This view shows how long pull requests stay open on average over time.
                    </summary>
                    <div>
                        <br />
                        It answers the question: On average, how many days does a PR remain open during each time bucket
                        (week or month)?
                        <ol>
                            <li>Track review/merge throughput over time.</li>
                            <li>Detect periods where PRs take longer to close (process slowdowns).</li>
                            <li>Compare authors or label-filtered subsets to surface bottlenecks.</li>
                        </ol>

                    </div>
                </details>
                    """,
                    sizing_mode="stretch_width",
                ),
                aggregate_by_select,
                pn.panel(
                    pn.bind(
                        plot_average_prs_open_by,
                        date_range_picker.param.value,
                        label_selector.param.value,
                        author_select.param.value,
                        aggregate_by_select.param.value,
                    ),
                    sizing_mode="stretch_width",
                ),
                sizing_mode="stretch_width",
            ),
            sizing_mode="stretch_width",
        ),
        pn.Row(
            pn.Column(
                "### Average Review Time By Author",
                pn.panel(
                    pn.bind(
                        plot_average_review_time_by_author,
                        date_range_picker.param.value,
                        label_selector.param.value,
                        author_select.param.value,
                    ),
                    sizing_mode="stretch_width",
                ),
                sizing_mode="stretch_width",
            ),
            sizing_mode="stretch_width",
        ),
        pn.Row(
            pn.Column(
                "### Comments by PR",
                pn.panel(
                    pn.bind(
                        plot_average_pr_comments,
                        date_range_picker.param.value,
                        label_selector.param.value,
                        author_select.param.value,
                    ),
                    sizing_mode="stretch_width",
                ),
                sizing_mode="stretch_width",
            ),
            sizing_mode="stretch_width",
        ),
        pn.Row(
            pn.Column(
                "### PRs By Author",
                pn.panel(
                    pn.bind(
                        plot_prs_by_author,
                        date_range_picker.param.value,
                        label_selector.param.value,
                    ),
                    sizing_mode="stretch_width",
                ),
                sizing_mode="stretch_width",
            ),
            sizing_mode="stretch_width",
        ),
    )

    pr_filter_criteria = {
        "html_url": {"type": "input", "func": "like", "placeholder": "Enter url"},
        "title": {"type": "input", "func": "like", "placeholder": "Title"},
        "state": {"type": "list", "func": "like", "placeholder": "Select state"},
    }
    table = TabulatorComponent(
        df=pd.DataFrame(repository.all_prs),
        header_filters=pr_filter_criteria,
        filename="prs",
    )

    data = pn.Column(
        "## Data Section",
        "Explore your PR data with advanced filtering options and download capabilities.",
        pn.Row(table),
        sizing_mode="stretch_width",
    )

    return pn.Tabs(
        ("Insights", views),
        ("Data", data),
        sizing_mode="stretch_width",
        active=0,
    )
