from datetime import date
import panel as pn
from panel.template import MaterialTemplate

from dashboard.pipeline_section import pipeline_section
from dashboard.prs_section import prs_section
from dashboard.source_code_section import source_code_section

pn.extension()

# Widgets
start_date_picker = pn.widgets.DatePicker(name="Start Date", value=date(2025, 8, 5))
end_date_picker = pn.widgets.DatePicker(name="End Date", value=date(2025, 8, 15))
anonymize = pn.widgets.Checkbox(name="Anonymize Data", value=False)


# Shared Header Section
header_section = pn.Column()
header_section_prs = pn.Row(
    start_date_picker, end_date_picker, pn.Row(anonymize), sizing_mode="stretch_width"
)
header_section_pipeline = pn.Row(
    start_date_picker, end_date_picker, sizing_mode="stretch_width"
)

# Pass widgets explicitly to the sections
pipeline_section = pipeline_section(
    start_date_picker=start_date_picker, end_date_picker=end_date_picker
)
prs_section = prs_section(
    start_date_picker=start_date_picker,
    end_date_picker=end_date_picker,
    anonymize=anonymize,
)

# Wrap the header_section and tabs in a template to make the header sticky
template = MaterialTemplate(title="Software Metrics Machine")

template.header.append(header_section)  # Add the header to the sticky header section

template.main.append(
    pn.Tabs(
        ("Pipeline", pipeline_section),
        ("Pull requests", prs_section),
        ("Source code", source_code_section),
        sizing_mode="stretch_width",
    )
)

template.servable()
