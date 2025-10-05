from datetime import date
import panel as pn
from panel.template import MaterialTemplate

from apps.dashboard.insights_section import insights_section
from apps.dashboard.pipeline_section import pipeline_section
from apps.dashboard.prs_section import prs_section
from apps.dashboard.source_code_section import source_code_section
from apps.dashboard.configuration_section import configuration_section
from infrastructure.configuration.configuration_builder import (
    ConfigurationBuilder,
    Driver,
)
from providers.github.workflows.repository_workflows import LoadWorkflows

pn.extension("tabulator")

configuration = ConfigurationBuilder(Driver.JSON).build()
repository = LoadWorkflows(configuration=configuration)

start_end_date_picker = pn.widgets.DateRangePicker(
    name="Select Date Range", value=(date(2025, 8, 5), date(2025, 8, 15))
)
anonymize = pn.widgets.Checkbox(name="Anonymize Data", value=False)

workflow_names = repository.get_unique_workflow_paths()

workflow_selector = pn.widgets.Select(
    name="Select Workflow",
    description="Select Workflow",
    options=workflow_names,
)
header_section = pn.Row(
    pn.Column(start_end_date_picker, workflow_selector), sizing_mode="stretch_width"
)
header_section_prs = pn.Row()
header_section_pipeline = pn.Row()

insights_section = insights_section(configuration, start_end_date_picker)
pipeline_section = pipeline_section(
    date_range_picker=start_end_date_picker,
    workflow_selector=workflow_selector,
    repository=repository,
)
prs_section = prs_section(start_end_date_picker, configuration, anonymize=anonymize)
source_code_section = source_code_section(configuration, start_end_date_picker)
configuration_section = configuration_section(configuration)

template = MaterialTemplate(
    title=f"Software Metrics Machine - {configuration.github_repository}",
    sidebar=[header_section],
)

tabs = pn.Tabs(
    ("Insights", insights_section),
    ("Pipeline", pipeline_section),
    ("Pull requests", prs_section),
    ("Source code", source_code_section),
    ("Configuration", configuration_section),
    sizing_mode="stretch_width",
    active=3,
)

template.main.append(tabs)


def on_tab_change(event):
    if event.new == 1 or event.new == 0:
        workflow_selector.visible = True
    else:
        workflow_selector.visible = False


tabs.param.watch(on_tab_change, "active")

workflow_selector.visible = False

template.servable()
