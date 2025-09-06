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
        df = repo.get_entity_effort()

        df = repo.apply_ignore_file_patterns(df, ignore_files)

        # Aggregate total effort per entity (using total-revs)
        effort_per_entity = df.groupby("entity")["total-revs"].max().sort_values()

        # Limit the number of entities displayed
        if len(effort_per_entity) > top_n:
            effort_per_entity = effort_per_entity[-top_n:]

        entities = effort_per_entity.index
        efforts = effort_per_entity.values

        fig, ax = plt.subplots(figsize=(10, max(6, len(entities) // 10)))
        ax.barh(entities, efforts, color="tab:purple")
        ax.set_xlabel("Total Effort (Revisions)")
        ax.set_ylabel("Entity")
        ax.set_title(
            f"Entity Effort (Top {min(top_n, len(effort_per_entity))} Entities by Total Revisions)"
        )
        plt.tight_layout()

        super().output(plt, fig, out_file=out_file)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Plot entity (File) effort")
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
