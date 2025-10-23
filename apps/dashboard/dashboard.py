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
from core.pipelines.pipelines_repository import PipelinesRepository

pn.extension("tabulator", "notifications")

# Disable automatic Holoviews axis-linking preprocessor to avoid dtype comparison
# errors when plots with incompatible axis dtypes (e.g., datetime vs numeric)
# are rendered/updated together. This prevents Panel's link_axes hook from
# running during layout preprocessing and avoids ufunc dtype promotion errors.
try:
    import panel.pane.holoviews as _ph

    _ph.Viewable._preprocessing_hooks = [
        h
        for h in _ph.Viewable._preprocessing_hooks
        if getattr(h, "__name__", "") != "link_axes"
    ]
except Exception:
    # best-effort; if this fails we continue without disabling the hook
    print("Warning: could not disable Holoviews axis-linking preprocessing hook")


def sanitize_all_argument(selected_value):
    if selected_value == "All":
        return None
    return selected_value


configuration = ConfigurationBuilder(Driver.JSON).build()
workflow_repository = PipelinesRepository(configuration=configuration)
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

workflow_selector = pn.widgets.AutocompleteInput(
    name="Select pipeline",
    description="Select pipeline",
    search_strategy="includes",
    restrict=False,
    case_sensitive=False,
    min_characters=0,
    options=workflow_names,
    value=configuration.deployment_frequency_target_pipeline,
)

jobs_selector = pn.widgets.AutocompleteInput(
    name="Select job",
    description="Select job",
    search_strategy="includes",
    restrict=False,
    case_sensitive=False,
    min_characters=0,
    options=[],
    value=None,
)


def _update_jobs_selector_for_workflow(path):
    options = workflow_repository.get_unique_jobs_name(
        {"path": sanitize_all_argument(path)}
    )

    # keep the last option as default if available
    default = options[len(options) - 1] if options and len(options) > 0 else None
    jobs_selector.options = options
    # only override value if current value is None or not in new options
    if jobs_selector.value is None or jobs_selector.value not in options:
        jobs_selector.value = default


# Initialize jobs_selector from current workflow_selector value
_update_jobs_selector_for_workflow(workflow_selector.value)

# Watch workflow_selector changes to update jobs options/value
workflow_selector.param.watch(
    lambda ev: _update_jobs_selector_for_workflow(ev.new), "value"
)

workflow_conclusions = workflow_repository.get_unique_workflow_conclusions(
    {"path": sanitize_all_argument(workflow_selector.value)}
)
selected_conclusion = None
if len(workflow_conclusions) > 0:
    last = len(workflow_conclusions) - 1
    selected_conclusion = workflow_conclusions[last]

workflow_conclusions = pn.widgets.Select(
    name="Select pipeline conclusion",
    description="Select pipeline conclusion",
    options=workflow_conclusions,
    value=selected_conclusion,
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
source_code_section = source_code_section(
    repository=codemaat_repository, start_end_date_picker=start_end_date_picker
)
configuration_section = configuration_section(configuration)

unique_authors = prs_repository.get_unique_authors()
unique_labels = prs_repository.get_unique_labels()

label_names = [label["label_name"] for label in unique_labels]

author_select = pn.widgets.MultiChoice(
    name="Select Authors",
    options=unique_authors,
    placeholder="Select authors to filter, by the default all are included",
    value=[],
)

label_selector = pn.widgets.MultiChoice(
    name="Select Labels",
    options=label_names,
    placeholder="Select labels to filter, by the default all are included",
    value=[],
)

prs_section = prs_section(
    start_end_date_picker, author_select, label_selector, repository=prs_repository
)

tabs = pn.Tabs(
    ("Insights", insights_section),
    ("Pipeline", pipeline_section),
    ("Pull requests", prs_section),
    ("Source code", source_code_section),
    ("Configuration", configuration_section),
    sizing_mode="stretch_width",
    dynamic=False,
    active=1,
)

header_section = pn.Column(
    pn.Column(
        pn.Row(
            pn.Column(start_end_date_picker, workflow_selector, workflow_conclusions),
        )
    ),
    pn.Row(
        pn.panel(jobs_selector, sizing_mode="stretch_width"),
        sizing_mode="stretch_width",
    ),
    pn.Row(
        pn.Column(author_select, label_selector),
    ),
    sizing_mode="stretch_width",
)

template = FastListTemplate(
    title=f"{configuration.github_repository} - {configuration.git_provider.title()}",
    right_sidebar=[header_section],
    accent=configuration.dashboard_color,
    collapsed_right_sidebar=False,
)

template.main.append(tabs)


def on_tab_change(event):
    active_tab(event.new)


tabs.param.watch(on_tab_change, "active")


def active_tab(current_tab: int):
    if current_tab == 1:
        workflow_selector.visible = True
        workflow_conclusions.visible = True
    else:
        workflow_selector.visible = False
        workflow_conclusions.visible = False


active_tab(tabs.active)

template.servable()
