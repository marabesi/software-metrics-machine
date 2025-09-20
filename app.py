import panel as pn
from providers.github.workflows.plots.view_workflow_by_status import (
    ViewWorkflowByStatus,
)
from providers.github.prs.plots.view_average_of_prs_open_by import (
    ViewAverageOfPrsOpenBy,
)

pn.extension()

# Widgets
start_date_picker = pn.widgets.DatePicker(name="Start Date")
end_date_picker = pn.widgets.DatePicker(name="End Date")


def plot_workflow_by_status(start_date, end_date):
    if start_date and end_date:
        print(f"Filtering Workflow By Status data from {start_date} to {end_date}")
    return ViewWorkflowByStatus().main(start_date=start_date, end_date=end_date)


def plot_average_prs_open_by():
    return ViewAverageOfPrsOpenBy().main()


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
)

dashboard.servable()
