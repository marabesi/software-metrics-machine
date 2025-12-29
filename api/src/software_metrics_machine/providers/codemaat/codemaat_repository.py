from software_metrics_machine.core.infrastructure.logger import Logger
from software_metrics_machine.core.infrastructure.pandas import pd
from pathlib import PurePosixPath
from typing import List
from io import StringIO

from software_metrics_machine.core.code.code_churn_types import (
    CodeChurn,
    CodeChurnFilters,
)
from software_metrics_machine.core.infrastructure.file_system_base_repository import (
    FileSystemBaseRepository,
)
from software_metrics_machine.core.infrastructure.configuration.configuration import (
    Configuration,
)


class CodemaatRepository(FileSystemBaseRepository):
    def __init__(self, configuration: Configuration):
        self.configuration: Configuration = configuration
        super().__init__(configuration=self.configuration, target_subfolder="codemaat")
        self.logger = Logger(configuration=configuration).get_logger()

    def get_code_churn(
        self, filters: CodeChurnFilters | None = None
    ) -> List[CodeChurn]:
        file = "abs-churn.csv"

        file_path = super().read_file_if_exists(file)
        if not file_path:
            return []

        data = self.__parse_csv(file_path)

        if filters:
            start_date = filters.get("start_date")
            end_date = filters.get("end_date")
            if start_date and end_date:
                sd = pd.to_datetime(start_date).date()
                ed = pd.to_datetime(end_date).date()
                data["date_parsed"] = pd.to_datetime(data["date"]).dt.date
                data = data[(data["date_parsed"] >= sd) & (data["date_parsed"] <= ed)]
        output = []
        for _, row in data.iterrows():
            output.append(
                CodeChurn(
                    **{
                        "date": row.get("date"),
                        "added": row.get("added") or 0,
                        "deleted": row.get("deleted") or 0,
                        "commits": row.get("commits") or 0,
                    }
                )
            )
        return output

    def get_coupling(
        self, ignore_files: str | None = None, filters: dict | None = None
    ):
        file = "coupling.csv"
        file_path = super().read_file_if_exists(file)
        if not file_path:
            return pd.DataFrame()

        data = self.__parse_csv(file_path)

        if ignore_files:
            data = self.apply_ignore_file_patterns(data, ignore_files)
            print(f"Filtered coupling data count: {len(data.values.tolist())}")

        if filters and filters.get("include_only"):
            include_patterns: str | None = filters.get("include_only") or None
            if include_patterns:
                # normalize patterns list (split by comma if necessary)
                data = self.__apply_include_only_filter(
                    data=data, include_patterns=include_patterns, column="entity"
                )
        return data

    def get_entity_churn(
        self, ignore_files: str | None = None, filters: dict | None = None
    ):
        file = "entity-churn.csv"

        file_path = super().read_file_if_exists(file)
        if not file_path:
            return pd.DataFrame()

        data = self.__parse_csv(file_path)

        if "entity" in data.columns:
            data["entity_short"] = data["entity"].apply(self.__short_ent)

        if ignore_files:
            data = self.apply_ignore_file_patterns(data, ignore_files)
            print(f"Filtered get entity churn data count: {len(data.values.tolist())}")

        if filters and filters.get("include_only"):
            include_patterns: str | None = filters.get("include_only") or None
            if include_patterns:
                data = self.__apply_include_only_filter(
                    data=data, include_patterns=include_patterns, column="entity"
                )

        return data

    def get_entity_effort(self, filters: dict | None = None):
        file = "entity-effort.csv"
        file_path = super().read_file_if_exists(file)
        if not file_path:
            print("No entity effort data available to plot")
            return pd.DataFrame()

        data = self.__parse_csv(file_path)

        if filters and filters.get("include_only"):
            include_patterns: str | None = filters.get("include_only") or None
            if include_patterns:
                data = self.__apply_include_only_filter(
                    data, include_patterns, column="entity"
                )
        return data

    def get_entity_ownership(
        self, authors: List[str] = [], filters: dict | None = None
    ):
        file = "entity-ownership.csv"
        file_path = super().read_file_if_exists(file)
        if not file_path:
            print("No entity effort data available to plot")
            return pd.DataFrame()

        data = self.__parse_csv(file_path)

        if "entity" in data.columns:
            data["entity_short"] = data["entity"].apply(self.__short_ent)

        print(f"Found {len(data)} row for entity ownership")

        if filters and filters.get("include_only"):
            include_patterns: str | None = filters.get("include_only") or None
            if include_patterns:
                data = self.__apply_include_only_filter(
                    data, include_patterns, column="entity"
                )

        return data[data["author"].isin(authors)] if authors else data

    def get_entity_ownership_unique_authors(self):
        df = self.get_entity_ownership()
        if df.empty:
            return []
        return df["author"].dropna().unique().tolist()

    def apply_ignore_file_patterns(
        self, df: pd.DataFrame, ignore_files: str | None
    ) -> pd.DataFrame:
        ignore_patterns: List[str] = []
        if ignore_files:
            ignore_patterns = ignore_files.split(",")

        if len(ignore_patterns) > 0:
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
            self.logger.debug(
                f"Applied ignore file patterns: {pats}, remaining rows: {len(df)}"
            )
            return df
        return df

    def __short_ent(self, val: str) -> str:
        if val is None:
            return val
        s = str(val)
        return s[-20:] if len(s) > 20 else s

    def __apply_include_only_filter(
        self, data: pd.DataFrame, include_patterns: str, column: str
    ):
        pats = [p.strip() for p in include_patterns.split(",") if p.strip()]

        def matches_any_pattern(fname: str) -> bool:
            p = PurePosixPath(fname)
            for pat in pats:
                try:
                    self.logger.debug(
                        f"Matching {fname} against pattern {pat}", p.match(pat)
                    )
                    if p.match(pat):
                        return True
                except Exception:
                    # fallback to simple equality or fnmatch
                    from fnmatch import fnmatch

                    if fnmatch(fname, pat):
                        return True
            return False

        # filter to matching rows
        mask = data[column].apply(lambda x: matches_any_pattern(str(x)))
        data = data[mask]
        print(
            f"Applied include only file patterns: {pats}, remaining rows: {len(data)}"
        )
        return data

    def __parse_csv(self, data: str):
        csvStringIO = StringIO(data)
        return pd.read_csv(csvStringIO, sep=",")
