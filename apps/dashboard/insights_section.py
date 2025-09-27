import panel as pn

pn.extension("tabulator")


def insights_section():
    return pn.Column(
        "## Insight section",
        pn.Row(),
    )
