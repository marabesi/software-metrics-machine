from datetime import datetime, date, timezone
from typing import List, Optional
from pathlib import Path
from software_metrics_machine.core.infrastructure.configuration.configuration import (
    Configuration,
)
from software_metrics_machine.core.infrastructure.file_system_handler import (
    FileSystemHandler,
)


class FileSystemBaseRepository:

    def __init__(self, configuration: Configuration):
        self.default_dir = str(configuration.store_data)
        self.file_system_handler = FileSystemHandler(self.default_dir)
        self.configuration = configuration

    def default_path_for(self, filename: str) -> str:
        final_path = self.default_dir + "/" + filename
        p = Path(final_path)
        print(f"Using data directory: {p.absolute()}")
        return p.absolute().__str__()

    def read_file_if_exists(self, filename: str) -> Optional[str]:
        return self.file_system_handler.read_file_if_exists(filename)

    def store_file(self, file: str, data: str) -> None:
        return self.file_system_handler.store_file(file, data)

    def remove_file(self, filename: str) -> Optional[str]:
        return self.file_system_handler.remove_file(filename)

    def created_at_key_sort(self, collection):
        created = collection.get("created_at")
        if created:
            return datetime.fromisoformat(created.replace("Z", "+00:00"))
        else:
            return datetime.min.replace(tzinfo=timezone.utc)

    def filter_by_date_range(
        self, items: List[dict], start_date: datetime, end_date: datetime
    ):
        filtered = []
        sd = self.__to_dt(start_date)
        ed = self.__to_dt(end_date)

        for run in items:
            created = run.get("created_at")

            if not created:
                continue
            try:
                created_dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
                if created_dt.tzinfo is None:
                    created_dt = created_dt.replace(tzinfo=timezone.utc)
                else:
                    created_dt = created_dt.astimezone(timezone.utc)
            except Exception:
                print(f"Could not parse created_at date: {created}")
                continue

            if sd.date() <= created_dt.date() <= ed.date():
                filtered.append(run)

        return filtered

    def parse_raw_filters(self, raw_filters: str | None = None) -> dict:
        params = {}
        if raw_filters:
            for f in raw_filters.split(","):
                if "=" in f:
                    k, v = f.split("=", 1)
                    params[k] = None if v == "None" else v
        return params

    def __to_dt(self, v):
        if v is None:
            return None
        if isinstance(v, datetime):
            if v.tzinfo is None:
                return v.replace(tzinfo=timezone.utc)
            return v.astimezone(timezone.utc)
        if isinstance(v, date):
            return datetime(v.year, v.month, v.day, tzinfo=timezone.utc)
        if isinstance(v, str):
            try:
                dt = datetime.fromisoformat(v.replace("Z", "+00:00"))
                if dt.tzinfo is None:
                    return dt.replace(tzinfo=timezone.utc)
                return dt.astimezone(timezone.utc)
            except Exception:
                return None
        return None
