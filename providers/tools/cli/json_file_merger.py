import click

from core.infrastructure.json_file_merger import JsonFileMerger
from core.infrastructure.repository_factory import \
    create_file_system_repository


@click.command(name="json-merger")
@click.option(
    "--input-file-paths",
    type=str,
    required=True,
)
@click.option("--output-path", type=str, required=True)
@click.option(
    "--unique-key",
    "-k",
    default="id",
    type=str,
    help="Field name to use as unique key for deduplication (default: id)",
)
def json_merger(input_file_paths: str, output_path: str, unique_key: str):
    """Merge multiple JSON files containing lists of objects, deduplicate by UNIQUE_KEY, and save to OUTPUT_PATH.

    INPUT_FILE_PATHS: one or more JSON files to merge
    OUTPUT_PATH: path where merged JSON will be written
    """

    repository = create_file_system_repository()
    exploded_file_paths = input_file_paths.split(",")
    merger = JsonFileMerger(repository=repository)
    merger.merge_files(exploded_file_paths, output_path, unique_key=unique_key)


command = json_merger
