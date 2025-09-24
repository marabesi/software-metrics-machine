from datetime import date
import panel as pn
from panel.template import MaterialTemplate

from dashboard import insights_section
from dashboard.pipeline_section import pipeline_section
from dashboard.prs_section import prs_section
from dashboard.source_code_section import source_code_section

pn.extension()

start_end_date_picker = pn.widgets.DateRangePicker(
    name="Select Date Range", value=(date(2025, 8, 5), date(2025, 8, 15))
)
anonymize = pn.widgets.Checkbox(name="Anonymize Data", value=False)


header_section = pn.Column()
header_section_prs = pn.Row(start_end_date_picker, sizing_mode="stretch_width")
header_section_pipeline = pn.Row(start_end_date_picker, sizing_mode="stretch_width")

pipeline_section = pipeline_section(start_end_date_picker)
prs_section = prs_section(start_end_date_picker, anonymize=anonymize)

template = MaterialTemplate(title="Software Metrics Machine")

template.header.append(header_section)

template.main.append(
    pn.Tabs(
        ("Insights", insights_section),
        ("Pipeline", pipeline_section),
        ("Pull requests", prs_section),
        ("Source code", source_code_section),
        sizing_mode="stretch_width",
        active=1,
    )
)

template.servable()
