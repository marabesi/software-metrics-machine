import pandas as pd
from pathlib import Path
from pathlib import PurePosixPath
from typing import List, Any

from core.infrastructure.file_system_base_repository import FileSystemBaseRepository
from core.infrastructure.configuration.configuration import Configuration


class CodemaatRepository(FileSystemBaseRepository):
    def __init__(self, configuration: Configuration):
        self.configuration = configuration
        super().__init__(configuration=self.configuration)

    def get_code_churn(self, filters: None = None):
        file_path = Path(f"{self.configuration.store_data}/abs-churn.csv")
        if not file_path.exists():
            return pd.DataFrame()
        data = pd.read_csv(file_path)
        if filters:
            start_date = filters.get("start_date")
            end_date = filters.get("end_date")
            if start_date and end_date:
                sd = pd.to_datetime(start_date).date()
                ed = pd.to_datetime(end_date).date()
                data["date"] = pd.to_datetime(data["date"]).dt.date
                data = data[(data["date"] >= sd) & (data["date"] <= ed)]
        return data

    def get_coupling(self, ignore_files: str | None = None):
        file_path = Path(f"{self.configuration.store_data}/coupling.csv")
        if not file_path.exists():
            return pd.DataFrame()
        if ignore_files:
            df = pd.read_csv(file_path)
            data = self.apply_ignore_file_patterns(df, ignore_files)
            print(f"Filtered coupling data count: {len(data.values.tolist())}")
            return data
        return pd.read_csv(file_path)

    def get_entity_churn(self):
        file_path = Path(f"{self.configuration.store_data}/entity-churn.csv")
        if not file_path.exists():
            return pd.DataFrame()

        data = pd.read_csv(file_path)
        if "entity" in data.columns:
            data["short_entity"] = data["entity"].apply(self.__short_ent)

        return data

    def get_entity_effort(self):
        file_path = Path(f"{self.configuration.store_data}/entity-effort.csv")
        if not file_path.exists():
            print("No entity effort data available to plot")
            return pd.DataFrame()
        return pd.read_csv(file_path)

    def get_entity_ownership(self, authors: List[str] = []):
        file_path = Path(f"{self.configuration.store_data}/entity-ownership.csv")
        if not file_path.exists():
            return pd.DataFrame()
        data = pd.read_csv(file_path)

        if "entity" in data.columns:
            data["short_entity"] = data["entity"].apply(self.__short_ent)

        print(f"Found {len(data)} row for entity ownership")
        return data[data["author"].isin(authors)] if authors else data

    def get_entity_ownership_unique_authors(self):
        df = self.get_entity_ownership()
        if df.empty:
            return []
        return df["author"].dropna().unique().tolist()

    def apply_ignore_file_patterns(
        self, df: pd.DataFrame, ignore_files: str | None
    ) -> Any:
        ignore_patterns: List[str] = ignore_files or []
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
            print(f"Applied ignore file patterns: {pats}, remaining rows: {len(df)}")
            return df
        return df

    def __short_ent(self, val: str) -> str:
        if val is None:
            return val
        s = str(val)
        return s[-12:] if len(s) > 12 else s
