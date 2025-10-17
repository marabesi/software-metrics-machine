from datetime import date, datetime, timedelta
import panel as pn
from panel.template import FastListTemplate

from apps.dashboard.insights_section import insights_section
from apps.dashboard.pipeline_section import pipeline_section
from apps.dashboard.prs_section import prs_section
from apps.dashboard.source_code_section import source_code_section
from apps.dashboard.configuration_section import configuration_section
from core.infrastructure.configuration.configuration_builder import (
    ConfigurationBuilder,
    Driver,
)
from providers.codemaat.codemaat_repository import CodemaatRepository
from core.prs.prs_repository import PrsRepository
from core.pipelines.pipelines_repository import LoadWorkflows

pn.extension("tabulator")

configuration = ConfigurationBuilder(Driver.JSON).build()
workflow_repository = LoadWorkflows(configuration=configuration)
prs_repository = PrsRepository(configuration=configuration)
codemaat_repository = CodemaatRepository(configuration=configuration)

current_date = date.today()
start_date = current_date - timedelta(days=6 * 30)  # Approximation of 6 months
end_date = current_date

if configuration.dashboard_start_date and configuration.dashboard_end_date:
    start_date = datetime.strptime(configuration.dashboard_start_date, "%Y-%m-%d")
    end_date = datetime.strptime(configuration.dashboard_end_date, "%Y-%m-%d")

start_end_date_picker = pn.widgets.DateRangePicker(
    name="Select Date Range", value=(start_date, end_date)
)

workflow_names = workflow_repository.get_unique_workflow_paths()

workflow_selector = pn.widgets.Select(
    name="Select pipeline",
    description="Select pipeline",
    options=workflow_names,
)

job_names = workflow_repository.get_unique_jobs_name()

jobs_selector = pn.widgets.Select(
    name="Select job",
    description="Select job",
    options=job_names,
)

workflow_conclusions = workflow_repository.get_unique_workflow_conclusions()
workflow_conclusions = pn.widgets.Select(
    name="Select conclusion",
    description="Select conclusion",
    options=workflow_conclusions,
)
header_section = pn.Row(
    pn.Column(start_end_date_picker, workflow_selector, workflow_conclusions),
    sizing_mode="stretch_width",
)
header_section_prs = pn.Row()
header_section_pipeline = pn.Row()

insights_section = insights_section(
    repository=workflow_repository, date_range_picker=start_end_date_picker
)
pipeline_section = pipeline_section(
    date_range_picker=start_end_date_picker,
    workflow_selector=workflow_selector,
    jobs_selector=jobs_selector,
    workflow_conclusions=workflow_conclusions,
    repository=workflow_repository,
)
prs_section = prs_section(start_end_date_picker, repository=prs_repository)
source_code_section = source_code_section(
    repository=codemaat_repository, start_end_date_picker=start_end_date_picker
)
configuration_section = configuration_section(configuration)

template = FastListTemplate(
    title=f"{configuration.github_repository}",
    sidebar=[header_section],
)

tabs = pn.Tabs(
    ("Insights", insights_section),
    ("Pipeline", pipeline_section),
    ("Pull requests", prs_section),
    ("Source code", source_code_section),
    ("Configuration", configuration_section),
    sizing_mode="stretch_width",
    active=2,
)

template.main.append(tabs)


def on_tab_change(event):
    if event.new == 1:
        workflow_selector.visible = True
        workflow_conclusions.visible = True
    else:
        workflow_selector.visible = False
        workflow_conclusions.visible = False


tabs.param.watch(on_tab_change, "active")

workflow_selector.visible = False
workflow_conclusions.visible = False

template.servable()
