from datetime import date
import panel as pn
from providers.github.workflows.plots.view_workflow_by_status import (
    ViewWorkflowByStatus,
)
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


# Pipeline Section
def plot_workflow_by_status(start_date, end_date):
    # if start_date and end_date:
    #     print(f"Filtering Workflow By Status data from {start_date} to {end_date}")
    return ViewWorkflowByStatus().main(start_date=start_date, end_date=end_date)


pipeline_section = pn.Column(
    "## Pipeline Section",
    start_date_picker,
    end_date_picker,
    pn.bind(
        plot_workflow_by_status, start_date=start_date_picker, end_date=end_date_picker
    ),
)


# PRs Section
def plot_average_prs_open_by(start_date, end_date):
    # if start_date and end_date:
    #     print(f"Filtering Average PRs Open By data from {start_date} to {end_date}")
    return ViewAverageOfPrsOpenBy().main()


def plot_average_review_time_by_author(start_date, end_date):
    # if start_date and end_date:
    #     print(f"Filtering Average Review Time By Author data from {start_date} to {end_date}")
    return ViewAverageReviewTimeByAuthor().plot_average_open_time(title="testtts")


def plot_prs_by_author(start_date, end_date):
    # if start_date and end_date:
    #     print(f"Filtering PRs By Author data from {start_date} to {end_date}")
    return ViewPrsByAuthor().plot_top_authors("asdasdassa")


prs_section = pn.Column(
    "## PRs Section",
    start_date_picker,
    end_date_picker,
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

dashboard = pn.Tabs(
    ("Pipeline", pipeline_section), ("PRs", prs_section), sizing_mode="stretch_width"
)

dashboard.servable()
