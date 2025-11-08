from typing import Optional
from pathlib import Path
import json


class FileSystemHandler:

    def __init__(self, path):
        self.default_dir = str(path)

    def read_file_if_exists(self, filename: str) -> Optional[str]:
        final_path = self.default_dir + "/" + filename
        p = Path(final_path)
        if p.is_file():
            return p.read_text(encoding="utf-8")
        return None

    def store_file(self, file: str, data: str) -> bool:
        print(file)
        final_path = self.default_dir + "/" + file
        p = Path(final_path)
        # ensure parent directory exists
        p.parent.mkdir(parents=True, exist_ok=True)

        with p.open("w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        print(f"  → Data written to {p}")
        return True

    def remove_file(self, filename: str) -> Optional[None]:
        final_path = self.default_dir + "/" + filename
        p = Path(final_path)
        if p.is_file():
            return p.unlink()
        return None
