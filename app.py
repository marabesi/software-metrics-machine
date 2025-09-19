import panel as pn
from providers.github.workflows.view_workflow_by_status import ViewWorkflowByStatus

pn.extension()

start_date_picker = pn.widgets.DatePicker(name="Start Date")
end_date_picker = pn.widgets.DatePicker(name="End Date")


def plot_wave(start_date, end_date):
    if start_date and end_date:
        print(f"Filtering data from {start_date} to {end_date}")
    return ViewWorkflowByStatus().main(start_date=start_date, end_date=end_date)


dashboard = pn.Column(
    "## Matplotlib Example with Date Picker",
    start_date_picker,
    end_date_picker,
    pn.bind(plot_wave, start_date=start_date_picker, end_date=end_date_picker),
)

dashboard.servable()
