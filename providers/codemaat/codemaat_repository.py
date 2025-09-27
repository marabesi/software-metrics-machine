import pandas as pd
from pathlib import Path
from pathlib import PurePosixPath
import typing

from infrastructure.base_repository import BaseRepository
from infrastructure.configuration.configuration import Configuration


class CodemaatRepository(BaseRepository):
    def __init__(self, configuration: Configuration):
        self.configuration = configuration
        super().__init__(configuration=self.configuration)

    def get_code_churn(self):
        file_path = Path(f"{self.configuration.store_data}/abs-churn.csv")
        if not file_path.exists():
            return pd.DataFrame()
        return pd.read_csv(file_path)

    def get_coupling(self):
        file_path = Path(f"{self.configuration.store_data}/coupling.csv")
        if not file_path.exists():
            return pd.DataFrame()
        return pd.read_csv(file_path)

    def get_entity_churn(self):
        file_path = Path(f"{self.configuration.store_data}/entity-churn.csv")
        if not file_path.exists():
            return pd.DataFrame()
        return pd.read_csv(file_path)

    def get_entity_effort(self):
        file_path = Path(f"{self.configuration.store_data}/entity-effort.csv")
        if not file_path.exists():
            return pd.DataFrame()
        return pd.read_csv(file_path)

    def get_entity_ownership(self):
        file_path = Path(f"{self.configuration.store_data}/entity-ownership.csv")
        if not file_path.exists():
            return pd.DataFrame()
        return pd.read_csv(file_path)

    def apply_ignore_file_patterns(
        self, df: typing.Any, ignore_files: str | None
    ) -> typing.Any:
        ignore_patterns: typing.List[str] = ignore_files or []
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
            return df
        return df
