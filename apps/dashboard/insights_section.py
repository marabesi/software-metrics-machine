import panel as pn
from infrastructure.configuration.configuration import Configuration

pn.extension("tabulator")


def insights_section(configuration: Configuration):
    return pn.Column(
        "## Insight section",
        pn.Row(),
    )
