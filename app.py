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


def plot_workflow_by_status(start_date, end_date):
    # if start_date and end_date:
    #     print(f"Filtering Workflow By Status data from {start_date} to {end_date}")
    return ViewWorkflowByStatus().main(start_date=start_date, end_date=end_date)


def plot_average_prs_open_by():
    return ViewAverageOfPrsOpenBy().main()


def plot_review_time_by_author():
    return ViewAverageReviewTimeByAuthor().plot_average_open_time(title="test")


def prs_by_author():
    return ViewPrsByAuthor().plot_top_authors(title="test", top=10)


dashboard = pn.Column(
    "## Charts Viewer with Date Picker",
    start_date_picker,
    end_date_picker,
    pn.Row(
        pn.Column(
            "### Workflow By Status",
            pn.bind(
                plot_workflow_by_status,
                start_date=start_date_picker,
                end_date=end_date_picker,
            ),
        ),
    ),
    pn.Row(
        pn.Column("### Average PRs Open By", pn.bind(plot_average_prs_open_by)),
    ),
    pn.Row(
        pn.Column("### An By", pn.bind(plot_review_time_by_author)),
    ),
    pn.Row(
        pn.Column("### xxxx By", pn.bind(prs_by_author)),
    ),
)

dashboard.servable()
