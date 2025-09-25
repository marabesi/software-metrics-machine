import pandas as pd
from pathlib import PurePosixPath
import typing

from infrastructure.base_repository import BaseRepository
from infrastructure.configuration import Configuration


class CodemaatRepository(BaseRepository):
    def __init__(self, configuration: Configuration):
        self.configuration = configuration
        super().__init__(configuration=self.configuration)

    def get_code_churn(self):
        df = pd.read_csv(f"{self.configuration.store_data}/abs-churn.csv")
        return df

    def get_coupling(self):
        df = pd.read_csv(f"{self.configuration.store_data}/coupling.csv")
        return df

    def get_entity_churn(self):
        df = pd.read_csv(f"{self.configuration.store_data}/entity-churn.csv")
        return df

    def get_entity_effort(self):
        df = pd.read_csv(f"{self.configuration.store_data}/entity-effort.csv")
        return df

    def get_entity_ownership(self):
        df = pd.read_csv(f"{self.configuration.store_data}/entity-ownership.csv")
        return df

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
