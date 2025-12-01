import json
from software_metrics_machine.core.infrastructure.file_system_base_repository import (
    FileSystemBaseRepository,
)
from software_metrics_machine.core.infrastructure.json import as_json_string


class JsonFileMerger:
    def __init__(self, repository: FileSystemBaseRepository):
        self.repository = repository

    def merge_files(
        self,
        input_file_paths: list[str],
        output_path: str,
        unique_key: str = "id",
    ) -> list:
        if not input_file_paths or len(input_file_paths) < 2:
            raise ValueError("At least two input file paths are required for a merge.")

        print(f"Starting merge process for {len(input_file_paths)} files.")

        combined_data = []

        # 1. Read data from all files and append to a single list
        for file_path in input_file_paths:
            data = self.repository.read_file_if_exists(file_path) or "[]"
            data = json.loads(data)
            print(f"  → Loaded {len(data)} items from '{file_path}'.")

            if not isinstance(data, list):
                print(
                    f"  → Warning: File '{file_path}' does not contain a list. Skipping."
                )
                continue

            combined_data.extend(data)

        total_items_before_dedupe = len(combined_data)
        print(
            f"  → Combined total: {total_items_before_dedupe} items before deduplication."
        )

        # 2. Deduplicate using the unique_key
        # The logic remains the same and is highly efficient for this task.
        unique_items = {}
        items_without_key_count = 0
        for item in combined_data:
            key_value = item.get(unique_key)
            if key_value is not None:
                unique_items[key_value] = item
            else:
                items_without_key_count += 1

        if items_without_key_count > 0:
            print(
                f"  → Warning: Found {items_without_key_count} items without the unique key '{unique_key}'. These items will be ignored."  # noqa
            )

        deduplicated_list = list(unique_items.values())
        total_items_after_dedupe = len(deduplicated_list)

        num_duplicates_removed = total_items_before_dedupe - total_items_after_dedupe
        print(
            f"  → Deduplication complete. Removed {num_duplicates_removed} duplicate(s)."
        )
        print(f"  → Final item count: {total_items_after_dedupe}.")

        # 3. Store the final result
        self.repository.store_file(output_path, as_json_string(deduplicated_list))
        print(f"✅ Successfully saved merged data to '{output_path}'.")

        return deduplicated_list
