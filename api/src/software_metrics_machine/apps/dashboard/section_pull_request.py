from software_metrics_machine.core.infrastructure.pandas import pd
import panel as pn
from software_metrics_machine.apps.components.tabulator import (
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


def prs_section(
    date_range_picker, author_select, label_selector, repository: PrsRepository
) -> pn.Tabs:
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
                pn.pane.HTML(
                    """
                        This view illustrates the average time taken for pull requests to be reviewed and merged,
                        segmented by author. The reading is: On average, how many days does it take for PRs opened by a
                        specific author (in the x axis) to be reviewed and merged?
                    """
                ),
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
                pn.pane.HTML(
                    """
                    This view displays the average number of comments received by pull requests over time. It helps to
                    understand the level of engagement and feedback that pull requests are receiving from reviewers.

                    The average is calculated by dividing the total number of comments on PRs by the total number of PRs
                    within each time period (week or month). This provides insights into how actively PRs are being
                    discussed and reviewed.
                    """
                ),
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
                pn.pane.HTML(
                    """
                    This view displays the number of pull requests submitted by each author within the selected date range.
                    It helps identify the most active contributors to the repository. In addition, this might also
                    help to spot most knolwedgeable developers in the codebase based on their PR activity.
                    """
                ),
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
    prs_dicts = [p.model_dump() for p in repository.all_prs]
    table = TabulatorComponent(
        df=pd.DataFrame(prs_dicts),
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
