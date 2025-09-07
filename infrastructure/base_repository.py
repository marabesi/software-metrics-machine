from datetime import datetime, timezone
from typing import Optional
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
