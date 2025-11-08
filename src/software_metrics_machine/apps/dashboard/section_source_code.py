import panel as pn
from software_metrics_machine.providers.codemaat.plots.code_churn import CodeChurnViewer
from software_metrics_machine.providers.codemaat.plots.coupling import CouplingViewer
from software_metrics_machine.providers.codemaat.plots.entity_churn import (
    EntityChurnViewer,
)
from software_metrics_machine.providers.codemaat.plots.entity_effort import (
    EntityEffortViewer,
)
from software_metrics_machine.providers.codemaat.plots.entity_ownership import (
    EntityOnershipViewer,
)
from software_metrics_machine.providers.codemaat.codemaat_repository import (
    CodemaatRepository,
)
from software_metrics_machine.core.code.pairing_index import PairingIndex
from software_metrics_machine.providers.pydriller.commit_traverser import (
    CommitTraverser,
)
import typing

pn.extension("tabulator")


def source_code_section(
    repository: CodemaatRepository,
    start_end_date_picker,
    ignore_pattern_files,
    include_pattern_files,
    author_select_source_code,
    pre_selected_values,
    top_entries,
):
    authors_text = pn.widgets.TextInput(
        name="Authors filter", placeholder="comma-separated emails", value=""
    )

    def update_ignore_pattern(event):
        ignore_pattern_files.value = event.new

    pre_selected_values.param.watch(update_ignore_pattern, "value")

    def plot_code_churn(date_range_picker):
        chart = (
            CodeChurnViewer(repository=repository)
            .render(
                start_date=date_range_picker[0],
                end_date=date_range_picker[1],
            )
            .plot
        )
        return pn.panel(chart, sizing_mode="stretch_width")

    def plot_entity_churn(ignore_pattern, include_files, top):
        chart = (
            EntityChurnViewer(repository=repository)
            .render(
                ignore_files=ignore_pattern,
                top_n=int(top),
                include_only=include_files,
            )
            .plot
        )
        return pn.panel(chart, sizing_mode="stretch_width")

    def plot_entity_effort(ignore_pattern, include_files, top):
        chart = (
            EntityEffortViewer(repository=repository)
            .render_treemap(
                top_n=int(top),
                ignore_files=ignore_pattern,
                include_only=include_files,
            )
            .plot
        )
        return pn.panel(chart, sizing_mode="stretch_width")

    def plot_entity_ownership(ignore_pattern, include_files, authors, top, type_churn):
        chart = (
            EntityOnershipViewer(repository=repository)
            .render(
                ignore_files=ignore_pattern,
                include_only=include_files,
                authors=",".join(authors),
                top_n=int(top),
                type_churn=type_churn,
            )
            .plot
        )
        return pn.panel(chart, sizing_mode="stretch_width")

    def plot_code_coupling_with_controls(ignore_pattern_files, include_files, top):
        coupling_viewer = CouplingViewer(repository=repository)
        return pn.Column(
            coupling_viewer.render(
                top=int(top),
                ignore_files=ignore_pattern_files,
                include_only=include_files,
            ).plot
        )

    def render_pairing_index_card(date_range_picker, authors: str | None = None):
        """Render a small card showing the pairing index and the last 20 commits.

        The commit list prefers commits whose message contains the exact phrase
        'implemented the feature in the cli' (case-insensitive). If none match,
        the card falls back to the last 20 commits in the repository.
        """
        pi = PairingIndex(repository=repository)
        result = pi.get_pairing_index(
            start_date=date_range_picker[0],
            end_date=date_range_picker[1],
            authors=authors,
        )

        # Attempt to read pairing index from either of the possible keys
        pairing_val = None
        if isinstance(result, dict):
            pairing_val = (
                result.get("pairing_index")
                or result.get("pairing_index_percentage")
                or result.get("pairing_index_percentage")
            )

        pairing_text = (
            f"**Pairing index:** {pairing_val}%"
            if pairing_val is not None
            else "Pairing index: n/a"
        )

        # Get commit list from traverser
        commits_data: typing.List[typing.Dict[str, str]] = []
        try:
            traverser = CommitTraverser(configuration=repository.configuration)
            traverse_result = traverser.traverse_commits()
            commits_iter = (
                traverse_result.get("commits")
                if isinstance(traverse_result, dict)
                else traverse_result
            )
            commits_list = list(commits_iter)

            # Filter by explicit phrase first
            phrase = "implemented the feature in the cli"
            filtered = [c for c in commits_list if phrase in ((c.msg or "").lower())]

            source_list = filtered if filtered else commits_list[-20:]

            # Prepare rows newest-first
            for c in reversed(source_list[-20:]):
                author = getattr(getattr(c, "author", None), "name", "") or ""
                commits_data.append(
                    {
                        "author": author,
                        "msg": c.msg or "",
                        "hash": getattr(c, "hash", ""),
                    }
                )
        except Exception:
            # On errors, keep commits_data empty
            commits_data = []

        return pn.Column(
            authors_text,
            pn.pane.Markdown(pairing_text),
            sizing_mode="stretch_width",
        )

    type_churn = pn.widgets.Select(
        name="Select pipeline conclusion",
        description="Select pipeline conclusion",
        options=["added", "deleted"],
        value="added",
    )

    return pn.Column(
        "## Source code Section",
        pn.pane.HTML(
            """
            This section provides insights into the source code evolution of the repository, including metrics such as
            code churn, entity churn, entity effort, entity ownership, and code coupling. Use the controls below to
            filter and customize the visualizations according to your analysis needs. This analysis is powered by
            CodeMaat.
            """
        ),
        pn.layout.Divider(),
        pn.Row(
            pn.Column(
                "### Code Churn",
                pn.pane.HTML(
                    """
                <details style="cursor: pointer;">
                    <summary>
                    This view visualizes code churn over time by showing lines of code added and deleted. Use the date
                    range to filter the data.
                    </summary>
                    <div>
                        <br />
                        Code churn refers to the amount of code that has been added, modified, or deleted in a codebase
                        over a
                        specific period. It is a useful metric for understanding the level of activity and changes
                        occurring in
                        a software project. It helps with the following the questions:
                        <ol>
                            <li>What is the most active time of my repository?</li>
                        </ol>

                    </div>
                </details>
                    """,
                    sizing_mode="stretch_width",
                ),
                pn.bind(plot_code_churn, start_end_date_picker.param.value),
            ),
            sizing_mode="stretch_width",
        ),
        pn.Row(
            pn.Column(
                "### Entity Churn",
                pn.bind(
                    plot_entity_churn,
                    ignore_pattern_files.param.value,
                    include_pattern_files.param.value,
                    top_entries.param.value,
                ),
            ),
            sizing_mode="stretch_width",
        ),
        pn.Row(
            pn.Column(
                "### Entity Effort",
                pn.bind(
                    plot_entity_effort,
                    ignore_pattern_files.param.value,
                    include_pattern_files.param.value,
                    top_entries.param.value,
                ),
            ),
            sizing_mode="stretch_width",
        ),
        pn.Row(
            pn.Column(
                "### Entity Ownership",
                type_churn,
                pn.bind(
                    plot_entity_ownership,
                    ignore_pattern_files.param.value,
                    include_pattern_files.param.value,
                    author_select_source_code.param.value,
                    top_entries.param.value,
                    type_churn=type_churn.param.value,
                ),
            ),
            sizing_mode="stretch_width",
        ),
        pn.Row(
            pn.Column(
                "### Pairing Index",
                pn.bind(
                    render_pairing_index_card,
                    start_end_date_picker.param.value,
                    authors_text.param.value,
                ),
            ),
        ),
        pn.Row(
            pn.bind(
                plot_code_coupling_with_controls,
                ignore_pattern_files.param.value,
                include_pattern_files.param.value,
                top_entries.param.value,
            )
        ),
    )
