import argparse
import matplotlib.pyplot as plt
from pathlib import PurePosixPath
import typing

from infrastructure.base_viewer import MatplotViewer
from infrastructure.viewable import Viewable
from codemaat_repository import CodemaatRepository


class EntityEffortViewer(MatplotViewer, Viewable):
    def render(
        self,
        repo: CodemaatRepository,
        MAX_ENTITIES: int = 30,
        out_file: str | None = None,
    ) -> None:
        df = repo.get_entity_effort()

        # apply ignore-files patterns if provided on the viewer instance
        ignore_patterns: typing.List[str] = getattr(self, "_ignore_files", None) or []
        if ignore_patterns:
            if isinstance(ignore_patterns, str):
                pats = [p.strip() for p in ignore_patterns.split(",") if p.strip()]
            else:
                pats = [p.strip() for p in ignore_patterns if p]

            def matches_any_pattern(fname: str) -> bool:
                p = PurePosixPath(fname)
                for pat in pats:
                    try:
                        if p.match(pat):
                            return True
                    except Exception:
                        from fnmatch import fnmatch

                        if fnmatch(fname, pat):
                            return True
                return False

            df = df[df["entity"].apply(lambda x: not matches_any_pattern(str(x)))]

        # Aggregate total effort per entity (using total-revs)
        effort_per_entity = df.groupby("entity")["total-revs"].max().sort_values()

        # allow overriding MAX_ENTITIES via viewer._top
        top_n = getattr(self, "_top", None)
        if top_n:
            try:
                top_n = int(top_n)
            except Exception:
                top_n = None
            if top_n and top_n > 0:
                MAX_ENTITIES = top_n

        # Limit the number of entities displayed
        if len(effort_per_entity) > MAX_ENTITIES:
            effort_per_entity = effort_per_entity[-MAX_ENTITIES:]

        entities = effort_per_entity.index
        efforts = effort_per_entity.values

        fig, ax = plt.subplots(figsize=(10, max(6, len(entities) // 10)))
        ax.barh(entities, efforts, color="tab:purple")
        ax.set_xlabel("Total Effort (Revisions)")
        ax.set_ylabel("Entity")
        ax.set_title(
            f"Entity Effort (Top {min(MAX_ENTITIES, len(effort_per_entity))} Entities by Total Revisions)"
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
    viewer._top = args.top
    viewer._ignore_files = args.ignore_files
    viewer.render(df_repo, out_file=args.out_file)
