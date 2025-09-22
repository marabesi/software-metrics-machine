import matplotlib.pyplot as plt

from infrastructure.base_viewer import MatplotViewer
from infrastructure.viewable import Viewable
from providers.codemaat.codemaat_repository import CodemaatRepository


class EntityEffortViewer(MatplotViewer, Viewable):
    def render(
        self,
        repo: CodemaatRepository,
        top_n: int | None = 30,
        ignore_files: str | None = None,
        out_file: str | None = None,
    ) -> None:
        df = repo.get_entity_effort()

        df = repo.apply_ignore_file_patterns(df, ignore_files)

        # Aggregate total effort per entity (using total-revs)
        effort_per_entity = df.groupby("entity")["total-revs"].max().sort_values()

        # Limit the number of entities displayed
        if len(effort_per_entity) > top_n:
            effort_per_entity = effort_per_entity[-top_n:]

        entities = effort_per_entity.index
        efforts = effort_per_entity.values

        fig, ax = plt.subplots(figsize=super().get_fig_size())
        ax.barh(entities, efforts, color="tab:purple")
        ax.set_xlabel("Total Effort (Revisions)")
        ax.set_ylabel("Entity")
        ax.set_title(
            f"Entity Effort (Top {min(top_n, len(effort_per_entity))} Entities by Total Revisions)"
        )
        plt.tight_layout()

        return super().output(plt, fig, out_file=out_file)
