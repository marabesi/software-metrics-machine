import pytest
from software_metrics_machine.apps.cli import main


class TestCliToolsCommands:

    def test_executes_tools_to_merge_successfully(self, cli):
        result = cli.runner.invoke(main, ["tools", "json-merger", "--help"])
        assert 0 == result.exit_code

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
