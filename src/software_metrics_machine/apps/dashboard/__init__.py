from datetime import date, datetime, timedelta

import panel as pn
import panel.pane.holoviews as _ph
from panel.template import FastListTemplate

from software_metrics_machine.apps.components.filter_state import FilterState
from software_metrics_machine.apps.dashboard.section_configuration import (
    configuration_section,
)
from software_metrics_machine.apps.dashboard.section_insight import insights_section
from software_metrics_machine.apps.dashboard.section_pipeline import pipeline_section
from software_metrics_machine.apps.dashboard.section_pull_request import (
    prs_section as tab_pr_section,
)
from software_metrics_machine.apps.dashboard.section_source_code import (
    source_code_section,
)
from software_metrics_machine.core.infrastructure.configuration.configuration_builder import (
    Driver,
)
from software_metrics_machine.core.infrastructure.repository_factory import (
    create_configuration,
)
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)
from software_metrics_machine.core.prs.prs_repository import PrsRepository
from software_metrics_machine.providers.codemaat.codemaat_repository import (
    CodemaatRepository,
)

pn.extension(
    "bokeh",
    "tabulator",
    "notifications",
    raw_css=[
        ".smm-margin-top { margin-top: 15px }",
    ],
)

filter_state = FilterState()
settings = filter_state.get_settings()

# Disable automatic Holoviews axis-linking preprocessor to avoid dtype comparison
# errors when plots with incompatible axis dtypes (e.g., datetime vs numeric)
# are rendered/updated together. This prevents Panel's link_axes hook from
# running during layout preprocessing and avoids ufunc dtype promotion errors.
try:
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


configuration = create_configuration(Driver.JSON)
pipeline_repository = PipelinesRepository(configuration=configuration)
prs_repository = PrsRepository(configuration=configuration)
codemaat_repository = CodemaatRepository(configuration=configuration)

current_date = date.today()
start_date = current_date - timedelta(days=12 * 30)  # Approximation of 6 months
end_date = current_date

if configuration.dashboard_start_date and configuration.dashboard_end_date:
    start_date = datetime.strptime(configuration.dashboard_start_date, "%Y-%m-%d")
    end_date = datetime.strptime(configuration.dashboard_end_date, "%Y-%m-%d")

start_end_date_picker = pn.widgets.DateRangePicker(
    name="Select Date Range", value=(start_date, end_date)
)


def _set_filters_for_options():
    sd, ed = start_end_date_picker.value or (None, None)
    filters = {"start_date": sd, "end_date": ed}
    options = pipeline_repository.get_unique_workflow_paths(filters=filters)

    # preserve current selection when possible, otherwise pick a sensible default
    current_value = (
        getattr(workflow_selector, "value", None)
        if "workflow_selector" in globals()
        else None
    )
    workflow_selector.options = options
    if current_value and current_value in options:
        workflow_selector.value = current_value
    else:
        workflow_selector.value = configuration.deployment_frequency_target_pipeline


workflow_selector = pn.widgets.AutocompleteInput(
    name="Select pipeline",
    description="Select pipeline",
    search_strategy="includes",
    restrict=False,
    case_sensitive=False,
    min_characters=0,
    options=[],
    value=None,
)

_set_filters_for_options()

start_end_date_picker.param.watch(lambda ev: _set_filters_for_options(), "value")

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

branch = pn.widgets.TextInput(
    name="Branch",
    placeholder="Filter runs by target branch (e.g., main)",
    value=configuration.main_branch,
)

event = pn.widgets.AutocompleteInput(
    name="Event",
    placeholder="Filter runs by event (e.g., push)",
    options=pipeline_repository.get_unique_pipeline_trigger_events(),
    search_strategy="includes",
    restrict=False,
    case_sensitive=False,
    min_characters=0,
)


def _update_jobs_selector_for_workflow(path):
    options = pipeline_repository.get_unique_jobs_name(
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

workflow_conclusions = pipeline_repository.get_unique_workflow_conclusions(
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

workflow_status = pipeline_repository.get_unique_workflow_status(
    {"path": sanitize_all_argument(workflow_selector.value)}
)
selected_status = None
if len(workflow_status) > 0:
    last = len(workflow_status) - 1
    selected_status = workflow_status[last]

workflow_status_select = pn.widgets.Select(
    name="Select pipeline status",
    description="Select pipeline status",
    options=workflow_status,
    value=selected_status,
)

header_section_prs = pn.Row()
header_section_pipeline = pn.Row()

insights_section = insights_section(
    repository=pipeline_repository,
    codemaat_repository=codemaat_repository,
    date_range_picker=start_end_date_picker,
)
pipeline_section = pipeline_section(
    date_range_picker=start_end_date_picker,
    workflow_selector=workflow_selector,
    jobs_selector=jobs_selector,
    workflow_status=workflow_status_select,
    workflow_conclusions=workflow_conclusions,
    branch=branch,
    event=event,
    repository=pipeline_repository,
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

ignore_pattern_files = pn.widgets.TextAreaInput(
    placeholder="Ignore file patterns (comma-separated) - e.g. *.json,**/**/*.png",
    rows=6,
    auto_grow=True,
    max_rows=10,
)

include_pattern_files = pn.widgets.TextAreaInput(
    placeholder="Include-only file patterns (comma-separated) - e.g. src/**/*.py,**/*.ts",
    rows=6,
    auto_grow=True,
    max_rows=10,
)

author_select_source_code = pn.widgets.MultiChoice(
    name="Select Authors",
    placeholder="Select authors to filter, by the default all are included",
    options=codemaat_repository.get_entity_ownership_unique_authors(),
    value=[],
)

pre_selected_values = pn.widgets.Select(
    name="Ignore patterns",
    options={
        "None": "",
        "Js/Ts projects": "*.json,**/**/*.png,*.snap,*.yml,*.yaml,*.md,*.sh",
        "Python and Markdown": "*.py,*.md",
        "All Text Files": "*.txt,*.log",
    },
    value="",
)

top_entries = pn.widgets.Select(
    name="Limit to top N entries",
    options={
        "10": "10",
        "20": "20",
        "50": "50",
        "100": "100",
        "1000": "1000",
    },
    value="20",
)


def wrap_tabs(tabs: pn.Column | pn.Tabs):
    tabs.css_classes = ["smm-margin-top"]
    return tabs


prs_section: pn.Tabs = tab_pr_section(
    start_end_date_picker, author_select, label_selector, repository=prs_repository
)
source_code_section_tab: pn.Column = source_code_section(
    repository=codemaat_repository,
    start_end_date_picker=start_end_date_picker,
    ignore_pattern_files=ignore_pattern_files,
    include_pattern_files=include_pattern_files,
    author_select_source_code=author_select_source_code,
    pre_selected_values=pre_selected_values,
    top_entries=top_entries,
)

# Build tabs dynamically from a declarative structure so it's easy to control
# which header widgets are visible per tab. Each entry contains the tab
# title, the panel content, and a list of header widget names that should be
# visible when that tab is active.
TAB_DEFINITIONS = [
    {
        "title": "Insights",
        "view": wrap_tabs(insights_section),
        "show": ["start_end_date_picker"],
    },
    {
        "title": "Pipeline",
        "view": wrap_tabs(pipeline_section),
        "show": [
            "start_end_date_picker",
            "workflow_selector",
            "workflow_status_select",
            "workflow_conclusions",
            "jobs_selector",
            "branch",
            "event",
        ],
    },
    {
        "title": "Pull requests",
        "view": wrap_tabs(prs_section),
        "show": ["start_end_date_picker", "author_select", "label_selector"],
    },
    {
        "title": "Source code",
        "view": wrap_tabs(source_code_section_tab),
        "show": [
            "start_end_date_picker",
            "ignore_pattern_files",
            "include_pattern_files",
            "author_select_source_code",
            "pre_selected_values",
            "top_entries",
        ],
    },
]

# Helper map of widget name -> widget instance used by the visibility controller
_HEADER_WIDGETS = {
    "start_end_date_picker": start_end_date_picker,
    "workflow_selector": workflow_selector,
    "workflow_conclusions": workflow_conclusions,
    "workflow_status_select": workflow_status_select,
    "jobs_selector": jobs_selector,
    "branch": branch,
    "event": event,
    "author_select": author_select,
    "author_select_source_code": author_select_source_code,
    "label_selector": label_selector,
    "ignore_pattern_files": ignore_pattern_files,
    "pre_selected_values": pre_selected_values,
    "include_pattern_files": include_pattern_files,
    "top_entries": top_entries,
}

# Build the Tabs from definitions (keeps ordering)
tabs = pn.Tabs(
    *[(t["title"], t["view"]) for t in TAB_DEFINITIONS],
    sizing_mode="stretch_width",
    dynamic=False,
    active=settings.tab,
)

header_section = pn.Column(
    pn.Column(
        pn.Row(
            pn.Column(
                start_end_date_picker,
                workflow_selector,
                workflow_status_select,
                workflow_conclusions,
                jobs_selector,
                branch,
                event,
            ),
        )
    ),
    pn.Row(
        pn.Column(
            author_select,
            label_selector,
            pre_selected_values,
            ignore_pattern_files,
            include_pattern_files,
            author_select_source_code,
            top_entries,
        ),
    ),
    sizing_mode="stretch_width",
)

template = FastListTemplate(
    title=f"{configuration.github_repository} - {configuration.git_provider.title()}",
    right_sidebar=[header_section],
    sidebar=[configuration_section],
    accent=configuration.dashboard_color,
    collapsed_right_sidebar=False,
    collapsed_sidebar=True,
    favicon="./src/software_metrics_machine/apps/dashboard/images/favicon.ico",
)

template.main.append(tabs)


def on_tab_change(event):
    # event.new is the index of the active tab
    idx = int(event.new)
    filter_state.update_settings("tab", idx)
    try:
        cfg = TAB_DEFINITIONS[idx]
    except Exception:
        cfg = {"show": []}

    # show/hide header widgets according to the active tab's `show` list
    visible_set = set(cfg.get("show", []))
    for name, widget in _HEADER_WIDGETS.items():
        widget.visible = name in visible_set


tabs.param.watch(on_tab_change, "active")

pn.Param(settings)

# initialize visibility for the current active tab
on_tab_change(type("E", (), {"new": tabs.active}))


def main():
    # this is the entry point for the shipped app
    template.show(port=5006, verbose=True, address="0.0.0.0", open=False)


# this is the entry point for development
template.servable()
