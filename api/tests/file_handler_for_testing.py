from typing import List, Optional
from pathlib import Path

from software_metrics_machine.core.infrastructure.configuration.configuration import (
    Configuration,
)
from software_metrics_machine.core.infrastructure.file_system_base_repository import (
    FileSystemBaseRepository,
)
from tests.builders import as_json_string


class FileHandlerForTesting:

    def __init__(self, path, configuration: Configuration):
        self.file_system_handler = FileSystemBaseRepository(
            configuration=configuration, target_subfolder="github"
        )
        self.configuration = configuration
        self.default_dir = str(path)

        self.file_system_codemaat_handler = FileSystemBaseRepository(
            configuration=configuration, target_subfolder="codemaat"
        )

    def store_pipelines_with(self, data: List) -> bool:
        if isinstance(data, str):
            raise ValueError("string not accepted")
        return self.file_system_handler.store_file(
            "workflows.json", as_json_string(data)
        )

    def store_jobs_with(self, data: List) -> bool:
        return self.file_system_handler.store_file("jobs.json", as_json_string(data))

    def store_prs_with(self, data: List) -> bool:
        return self.file_system_handler.store_file("prs.json", as_json_string(data))

    def store_prs_comment_with(self, data: List) -> bool:
        return self.file_system_handler.store_file(
            "prs_review_comments.json", as_json_string(data)
        )

    def store_json_file(self, subfolder_or_file: str, file_or_data: any = None, data: any = None) -> bool:
        # Support both old and new signatures
        # Old: store_json_file(file, data)
        # New: store_json_file(subfolder, file, data)
        if data is None:
            # Old signature: (file, data)
            file = subfolder_or_file
            json_data = file_or_data
            handler = self.file_system_handler
        else:
            # New signature: (subfolder, file, data)
            subfolder = subfolder_or_file
            file = file_or_data
            json_data = data
            handler = FileSystemBaseRepository(
                configuration=self.configuration,
                target_subfolder=subfolder
            )
        
        handler.store_file(file, as_json_string(json_data))
        return True

    def store_file(self, file: str, data: str) -> bool:
        self.file_system_handler.store_file(file, as_json_string(data))
        print(f"  → Data written to {self.default_dir}/{file}")
        return True

    def store_csv_file(self, file: str, data: str) -> bool:
        self.file_system_codemaat_handler.store_file(file, data)
        print(
            f"  → Data written to {self.file_system_codemaat_handler.default_dir}/{file}"
        )
        return True

    def remove_file(self, filename: str) -> Optional[str]:
        final_path = self.default_dir + "/" + filename
        p = Path(final_path)
        if p.is_file():
            p.unlink()
            return final_path
        return None
