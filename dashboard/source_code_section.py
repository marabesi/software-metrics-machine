import panel as pn
from providers.codemaat.plots.code_churn import CodeChurnViewer
from providers.codemaat.plots.coupling import CouplingViewer
from providers.codemaat.plots.entity_churn import EntityChurnViewer
from providers.codemaat.plots.entity_effort import EntityEffortViewer
from providers.codemaat.plots.entity_ownership import EntityOnershipViewer
from providers.codemaat.codemaat_repository import CodemaatRepository

pn.extension()


def plot_code_churn():
    return CodeChurnViewer().render(
        CodemaatRepository(),
    )


def plot_code_coupling():
    return CouplingViewer().render(
        CodemaatRepository(),
    )


def plot_entity_churn():
    return EntityChurnViewer().render(CodemaatRepository())


def plot_entity_effort():
    return EntityEffortViewer().render(
        CodemaatRepository(),
    )


def plot_entity_ownership():
    return EntityOnershipViewer().render(
        CodemaatRepository(),
    )


source_code_section = pn.Column(
    "## Source code Section",
    pn.Row(
        pn.Column(
            "### Code Churn",
            pn.bind(
                plot_code_churn,
            ),
        ),
        sizing_mode="stretch_width",
    ),
    pn.Row(
        pn.Column(
            "### Entity Churn",
            pn.bind(
                plot_entity_churn,
            ),
        ),
        sizing_mode="stretch_width",
    ),
    pn.Row(
        pn.Column(
            "### Entity Effort",
            pn.bind(
                plot_entity_effort,
            ),
        ),
        sizing_mode="stretch_width",
    ),
    pn.Row(
        pn.Column(
            "### Entity Ownership",
            pn.bind(
                plot_entity_ownership,
            ),
        ),
        sizing_mode="stretch_width",
    ),
    pn.Row(
        pn.Column(
            "### Coupling",
            pn.bind(
                plot_code_coupling,
            ),
        ),
        sizing_mode="stretch_width",
    ),
)
