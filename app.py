from datetime import date
import panel as pn

from dashboard.pipeline_section import pipeline_section
from dashboard.prs_section import prs_section
from dashboard.source_code_section import source_code_section

pn.extension()

# Widgets
start_date_picker = pn.widgets.DatePicker(name="Start Date", value=date(2024, 4, 1))
end_date_picker = pn.widgets.DatePicker(name="End Date", value=date(2025, 9, 30))
anonymize = pn.widgets.Checkbox(name="Anonymize Data", value=False)


# Shared Header Section
header_section = pn.Column("## Software Metrics Dashboard", pn.Row(anonymize))
header_section_prs = pn.Row(
    start_date_picker, end_date_picker, sizing_mode="stretch_width"
)
header_section_pipeline = pn.Row(
    start_date_picker, end_date_picker, sizing_mode="stretch_width"
)

dashboard = pn.Column(
    header_section,
    pn.Tabs(
        ("Pipeline", pipeline_section(start_date_picker, end_date_picker)),
        ("Pull requests", prs_section(start_date_picker, end_date_picker)),
        ("Source code", source_code_section),
        sizing_mode="stretch_width",
    ),
)

dashboard.servable()
