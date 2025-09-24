from datetime import datetime, date, timezone
from typing import List, Optional
from pathlib import Path
from infrastructure.configuration import Configuration
import json


class BaseRepository:

    def __init__(self, configuration: Configuration):
        self.default_dir = configuration.store_data

    def default_path_for(self, filename: str) -> str:
        final_path = self.default_dir + "/" + filename
        p = Path(final_path)
        print(f"Using data directory: {p.absolute()}")
        return p.absolute()

    def read_file_if_exists(self, filename: str) -> Optional[str]:
        final_path = self.default_dir + "/" + filename
        p = Path(final_path)
        if p.is_file():
            return p.read_text(encoding="utf-8")
        return None

    def store_file(self, file: str, data: str) -> None:
        final_path = self.default_dir + "/" + file
        p = Path(final_path)
        # ensure parent directory exists
        try:
            p.parent.mkdir(parents=True, exist_ok=True)
        except Exception:
            # if directory creation fails, let the file write raise the appropriate error
            pass

        with p.open("w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        print(f"  → Data written to {p}")

    def remove_file(self, filename: str) -> Optional[str]:
        final_path = self.default_dir + "/" + filename
        p = Path(final_path)
        if p.is_file():
            return p.unlink()
        return None

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
                # if created_at cannot be parsed, skip this run
                continue

            if sd and created_dt <= sd:
                continue
            if ed and created_dt >= ed:
                continue

            filtered.append(run)

        return filtered

    def __to_dt(self, v):
        # accept None, datetime, date, or ISO string
        if v is None:
            return None
        if isinstance(v, datetime):
            if v.tzinfo is None:
                return v.replace(tzinfo=timezone.utc)
            return v.astimezone(timezone.utc)
        if isinstance(v, date):
            # convert date to datetime at midnight UTC
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
