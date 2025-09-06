import argparse
import matplotlib.pyplot as plt

from infrastructure.base_viewer import MatplotViewer
from infrastructure.viewable import Viewable
from codemaat_repository import CodemaatRepository


class EntityEffortViewer(MatplotViewer, Viewable):
    def render(
        self,
        repo: CodemaatRepository,
        top_n: int = 30,
        ignore_files: str | None = None,
        out_file: str | None = None,
    ) -> None:
        df = repo.get_entity_ownership()

        df = repo.apply_ignore_file_patterns(df, ignore_files)

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

        fig, ax = plt.subplots(figsize=(12, 6))
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
        super().output(plt, fig, out_file=out_file)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Plot entity (File) ownership")
    parser.add_argument(
        "--out-file",
        "-o",
        type=str,
        default=None,
        help="Optional path to save the plot image",
    )
    parser.add_argument(
        "--top",
        dest="top",
        type=int,
        default=None,
        help="Optional number of top entities to display (by total churn)",
    )
    parser.add_argument(
        "--ignore-files",
        dest="ignore_files",
        type=str,
        default=None,
        help="Optional comma-separated glob patterns to ignore (e.g. '*.json,**/**/*.png')",
    )
    args = parser.parse_args()
    viewer = EntityEffortViewer()
    df_repo = CodemaatRepository()
    viewer.render(
        df_repo, top_n=args.top, ignore_files=args.ignore_files, out_file=args.out_file
    )
