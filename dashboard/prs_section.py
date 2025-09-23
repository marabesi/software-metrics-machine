import panel as pn
from infrastructure.configuration import Configuration
from providers.github.prs.plots.view_average_of_prs_open_by import (
    ViewAverageOfPrsOpenBy,
)
from providers.github.prs.plots.view_average_review_time_by_author import (
    ViewAverageReviewTimeByAuthor,
)
from providers.github.prs.plots.view_prs_by_author import (
    ViewPrsByAuthor,
)

from providers.github.prs.prs_repository import LoadPrs

pn.extension()
prs_repository = LoadPrs(configuration=Configuration())


def plot_average_prs_open_by(date_range_picker):
    return ViewAverageOfPrsOpenBy(repository=prs_repository).main(
        start_date=date_range_picker[0], end_date=date_range_picker[1]
    )


def plot_average_review_time_by_author(date_range_picker):
    return ViewAverageReviewTimeByAuthor(
        repository=prs_repository
    ).plot_average_open_time(
        title="Average Review Time By Author",
        start_date=date_range_picker[0],
        end_date=date_range_picker[1],
    )


def plot_prs_by_author(date_range_picker):
    return ViewPrsByAuthor(repository=prs_repository).plot_top_authors(
        title="PRs By Author",
        start_date=date_range_picker[0],
        end_date=date_range_picker[1],
    )


def prs_section(date_range_picker, anonymize=False):
    # Fetch unique authors from the repository
    unique_authors = prs_repository.get_unique_authors()

    # Create a Select widget for authors with default unchecked
    author_select = pn.widgets.MultiSelect(
        name="Select Authors",
        options=unique_authors,
        size=10,
        value=[],
    )

    return pn.Column(
        "## PRs Section",
        pn.Row(date_range_picker, sizing_mode="stretch_width"),
        pn.Row(author_select, sizing_mode="stretch_width"),
        pn.Row(
            pn.Column(
                "### Average PRs Open By",
                pn.bind(plot_average_prs_open_by, date_range_picker),
            ),
            sizing_mode="stretch_width",
        ),
        pn.Row(
            pn.Column(
                "### Average Review Time By Author",
                pn.bind(plot_average_review_time_by_author, date_range_picker),
            ),
            sizing_mode="stretch_width",
        ),
        pn.Row(
            pn.Column(
                "### PRs By Author",
                pn.bind(plot_prs_by_author, date_range_picker),
            ),
            sizing_mode="stretch_width",
        ),
    )
