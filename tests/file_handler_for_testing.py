from typing import Optional
from pathlib import Path
import json

from tests.builders import as_json_string


class FileHandlerForTesting:

    def __init__(self, path):
        self.default_dir = str(path)

    def store_pipelines_with(self, data: str) -> bool:
        return self.store_file("workflows.json", as_json_string(data))

    def store_jobs_with(self, data: str) -> bool:
        return self.store_file("jobs.json", as_json_string(data))

    def store_prs_with(self, data: str) -> bool:
        return self.store_file("prs.json", as_json_string(data))

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
