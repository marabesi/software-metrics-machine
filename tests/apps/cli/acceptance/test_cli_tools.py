import pytest
from software_metrics_machine.apps.cli import main


class TestCliToolsCommands:

    @pytest.mark.parametrize(
        "command, expected_output_substring",
        [
            (
                ["tools", "json-merger"],
                "Missing option '--input-file-paths'",
            ),
            (
                ["tools", "json-merger", "--input-file-paths", "file1.json"],
                "Missing option '--output-path'",
            ),
        ],
    )
    def test_validates_tools_json_merger_required_parameters(
        self, cli, command, expected_output_substring
    ):
        result = cli.runner.invoke(main, command)
        assert expected_output_substring in result.output

    @pytest.mark.parametrize(
        "expected_output_substring",
        [
            "Starting merge process for 2 files.",
            "Loaded 2 items from 'input1.json'.",
            "Loaded 2 items from 'input2.json'.",
            "Combined total: 4 items before deduplication.",
            "Deduplication complete. Removed 2 duplicate(s).",
            "Final item count: 2.",
            "Successfully saved merged data to 'merged.json'",
        ],
    )
    def test_merge_two_files(self, cli, expected_output_substring):
        duplicated_data = [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]

        cli.storage.store_json_file("input1.json", duplicated_data)
        cli.storage.store_json_file("input2.json", duplicated_data)

        result = cli.runner.invoke(
            main,
            [
                "tools",
                "json-merger",
                "--input-file-paths",
                "input1.json,input2.json",
                "--output-path",
                "merged.json",
                "--unique-key",
                "id",
            ],
        )

        assert expected_output_substring in result.output
