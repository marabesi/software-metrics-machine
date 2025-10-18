import matplotlib.pyplot as plt
import pandas as pd

from core.infrastructure.base_viewer import BaseViewer
from core.infrastructure.viewable import Viewable
from providers.codemaat.codemaat_repository import CodemaatRepository


class EntityOnershipViewer(BaseViewer, Viewable):
    def __init__(self, repository: CodemaatRepository):
        self.repository = repository

    def render(
        self,
        top_n: int = 30,
        ignore_files: str | None = None,
        out_file: str | None = None,
        authors: str | None = None,
    ) -> None:
        repo = self.repository
        df = repo.get_entity_ownership(authors.split(",") if authors else [])

        if df.empty:
            # Create an empty DataFrame with expected columns
            df = pd.DataFrame(columns=["entity", "author", "added", "deleted"])
            print("No entity ownership data available to plot")

        df = repo.apply_ignore_file_patterns(df, ignore_files)

        print(f"Found {len(df)} row for entity ownership")

        ownership = (
            df.groupby(["entity", "author"])[["added", "deleted"]].sum().reset_index()
        )

        ownership["total"] = ownership["added"] + ownership["deleted"]
        top_entities = (
            ownership.groupby("entity")["total"]
            .sum()
            .sort_values(ascending=False)
            .head(top_n)
            .index
        )
        ownership = ownership[ownership["entity"].isin(top_entities)]

        pivot = ownership.pivot(
            index="entity", columns="author", values="added"
        ).fillna(0)
        pivot_deleted = ownership.pivot(
            index="entity", columns="author", values="deleted"
        ).fillna(0)

        fig, ax = plt.subplots(figsize=super().get_fig_size())
        bottom = None
        for author in pivot.columns:
            ax.bar(pivot.index, pivot[author], label=f"{author} added", bottom=bottom)
            if bottom is None:
                bottom = pivot[author]
            else:
                bottom += pivot[author]

        bottom_deleted = None
        for author in pivot_deleted.columns:
            ax.bar(
                pivot_deleted.index,
                pivot_deleted[author],
                label=f"{author} deleted",
                bottom=bottom_deleted,
                alpha=0.5,
            )
            if bottom_deleted is None:
                bottom_deleted = pivot_deleted[author]
            else:
                bottom_deleted += pivot_deleted[author]

        ax.set_xlabel("Entity")
        ax.set_ylabel("Lines Changed")
        ax.set_title("Entity Ownership: Lines Added and Deleted per Author")
        plt.xticks(rotation=45, ha="right")
        ax.legend(loc="upper right", bbox_to_anchor=(1.2, 1))
        plt.tight_layout()
        return super().output(plt, fig, out_file=out_file, repository=repo)
