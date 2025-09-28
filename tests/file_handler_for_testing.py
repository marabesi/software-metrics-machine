from typing import Optional
from pathlib import Path
import json


class FileHandlerForTesting:

    def __init__(self, path):
        self.default_dir = str(path)

    def store_json_file(self, file: str, data: str) -> bool:
        final_path = self.default_dir + "/" + file
        p = Path(final_path)

        with p.open("w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        print(f"  → Data written to {p}")
        return True

    def store_file(self, file: str, data: str) -> bool:
        final_path = self.default_dir + "/" + file
        p = Path(final_path)

        with p.open("w", encoding="utf-8") as f:
            f.write(data)
        print(f"  → Data written to {p}")
        return True

    def remove_file(self, filename: str) -> Optional[str]:
        final_path = self.default_dir + "/" + filename
        p = Path(final_path)
        if p.is_file():
            return p.unlink()
        return None
