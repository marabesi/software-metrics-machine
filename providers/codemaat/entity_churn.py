import argparse
import matplotlib.pyplot as plt
from pathlib import PurePosixPath
import typing

from infrastructure.base_viewer import MatplotViewer
from infrastructure.viewable import Viewable
from codemaat_repository import CodemaatRepository


class EntityChurnViewer(MatplotViewer, Viewable):
    def render(self, repo: CodemaatRepository, out_file: str | None = None) -> None:
        df = repo.get_entity_churn()

        # if dataframe doesn't contain expected columns, fail early
        if not {"entity", "added", "deleted"}.issubset(df.columns):
            raise RuntimeError(
                "entity-churn.csv is missing required columns: entity, added, deleted"
            )

        # default ordering: by total churn (added + deleted) descending
        df["total_churn"] = df.get("added", 0) + df.get("deleted", 0)

        # apply top-N filter if provided on the viewer instance
        top_n = getattr(self, "_top", None)
        if top_n:
            try:
                top_n = int(top_n)
            except Exception:
                top_n = None
        if top_n and top_n > 0:
            df = df.sort_values(by="total_churn", ascending=False).head(top_n)

        # apply ignore-files patterns if provided
        ignore_patterns: typing.List[str] = getattr(self, "_ignore_files", None) or []
        if ignore_patterns:
            # normalize patterns list (split by comma if necessary)
            if isinstance(ignore_patterns, str):
                pats = [p.strip() for p in ignore_patterns.split(",") if p.strip()]
            else:
                pats = [p.strip() for p in ignore_patterns if p]

            def matches_any_pattern(fname: str) -> bool:
                # use PurePosixPath.match to allow ** patterns; normalize to posix
                p = PurePosixPath(fname)
                for pat in pats:
                    try:
                        if p.match(pat):
                            return True
                    except Exception:
                        # fallback to simple equality or fnmatch
                        from fnmatch import fnmatch

                        if fnmatch(fname, pat):
                            return True
                return False

            # filter out matching rows
            mask = df["entity"].apply(lambda x: not matches_any_pattern(str(x)))
            df = df[mask]

        dates = df["entity"]
        added = df["added"]
        deleted = df["deleted"]

        fig, ax = plt.subplots(figsize=(12, 6))
        ax.bar(dates, added, label="Added", color="tab:blue")
        ax.bar(dates, deleted, bottom=added, label="Deleted", color="tab:red")

        ax.set_xlabel("Entity (File)")
        ax.set_ylabel("Lines of Code")
        ax.set_title("Code Entity Churn: Lines Added and Deleted")
        ax.legend()
        plt.xticks(rotation=45, ha="right")
        plt.tight_layout()

        super().output(plt, fig, out_file=out_file)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Plot coupling graph")
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
    viewer = EntityChurnViewer()
    # apply top-N filtering if requested inside render via repository DataFrame
    df_repo = CodemaatRepository()
    # pass top to render via attribute on viewer or adjust the repo; simplest: let render accept top via closure
    # implement by setting an attribute on viewer
    viewer._top = args.top
    viewer._ignore_files = args.ignore_files
    viewer.render(df_repo, out_file=args.out_file)
