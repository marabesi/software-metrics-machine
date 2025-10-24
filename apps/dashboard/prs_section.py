import pandas as pd
import panel as pn
from apps.dashboard.components.tabulator import TabulatorComponent
from core.prs.plots.view_average_of_prs_open_by import (
    ViewAverageOfPrsOpenBy,
)
from core.prs.plots.view_average_review_time_by_author import (
    ViewAverageReviewTimeByAuthor,
)
from core.prs.plots.view_open_prs_through_time import ViewOpenPrsThroughTime
from core.prs.plots.view_prs_by_author import (
    ViewPrsByAuthor,
)

from core.prs.prs_repository import PrsRepository

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

    def plot_average_prs_open_by(date_range_picker, selected_labels, author_select):
        return (
            ViewAverageOfPrsOpenBy(repository=repository)
            .main(
                start_date=date_range_picker[0],
                end_date=date_range_picker[1],
                labels=normalize_label(selected_labels),
                authors=normalize_authors(author_select),
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

    views = pn.Column(
        "## Pull requests",
        "A pull request is a request to merge a set of proposed changes into a codebase. It's the most common way developers propose, review, and discuss code before it becomes part of the main project.",  # noqa: E501
        pn.layout.Divider(),
        pn.Row(
            pn.Column(
                "### Open PRs Through Time",
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
                "### Average PRs Open By",
                pn.panel(
                    pn.bind(
                        plot_average_prs_open_by,
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
