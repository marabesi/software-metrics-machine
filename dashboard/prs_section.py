from datetime import date
import panel as pn
from providers.github.prs.plots.view_average_of_prs_open_by import (
    ViewAverageOfPrsOpenBy,
)
from providers.github.prs.plots.view_average_review_time_by_author import (
    ViewAverageReviewTimeByAuthor,
)
from providers.github.prs.plots.view_prs_by_author import (
    ViewPrsByAuthor,
)

pn.extension()

# Widgets
start_date_picker = pn.widgets.DatePicker(name="Start Date", value=date(2024, 4, 1))
end_date_picker = pn.widgets.DatePicker(name="End Date", value=date(2025, 9, 30))


# PRs Section
def plot_average_prs_open_by(start_date, end_date):
    return ViewAverageOfPrsOpenBy().main(start_date=start_date, end_date=end_date)


def plot_average_review_time_by_author(start_date, end_date):
    return ViewAverageReviewTimeByAuthor().plot_average_open_time(
        title="Average Review Time By Author", start_date=start_date, end_date=end_date
    )


def plot_prs_by_author(start_date, end_date):
    return ViewPrsByAuthor().plot_top_authors(
        title="PRs By Author", start_date=start_date, end_date=end_date
    )


prs_section = pn.Column(
    "## PRs Section",
    pn.Row(start_date_picker, end_date_picker, sizing_mode="stretch_width"),
    pn.Row(
        pn.Column(
            "### Average PRs Open By",
            pn.bind(
                plot_average_prs_open_by,
                start_date=start_date_picker,
                end_date=end_date_picker,
            ),
        ),
        sizing_mode="stretch_width",
    ),
    pn.Row(
        pn.Column(
            "### Average Review Time By Author",
            pn.bind(
                plot_average_review_time_by_author,
                start_date=start_date_picker,
                end_date=end_date_picker,
            ),
        ),
        sizing_mode="stretch_width",
    ),
    pn.Row(
        pn.Column(
            "### PRs By Author",
            pn.bind(
                plot_prs_by_author,
                start_date=start_date_picker,
                end_date=end_date_picker,
            ),
        ),
        sizing_mode="stretch_width",
    ),
)
