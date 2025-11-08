import pytest
from apps.cli.main import main
from tests.builders import single_run

from tests.file_handler_for_testing import FileHandlerForTesting


class TestPipelineSummaryCliCommands:

    def test_summary_pipeline_is_defined(self, cli):
        result = cli.runner.invoke(
            main,
            [
                "pipelines",
                "summary",
            ],
        )
        assert 0 == result.exit_code

    @pytest.mark.parametrize(
        "workflows, expected_output",
        [
            (single_run(), "Total runs: 1"),
            (single_run(), "Most failed run: N/A"),
            (single_run(), "1  <unnamed>  (/workflows/build.yml)"),
        ],
    )
    def test_summary_pipeline(self, cli, workflows, expected_output):
        path_string = cli.data_stored_at

        FileHandlerForTesting(path_string).store_pipelines_with(workflows)

        result = cli.runner.invoke(
            main,
            [
                "pipelines",
                "summary",
            ],
        )
        assert expected_output in result.output

    @pytest.mark.parametrize(
        "workflows",
        [
            [
                {
                    "id": 1,
                    "path": "/workflows/build.yml",
                    "conclusion": "success",
                    "created_at": "2023-10-01T12:00:00Z",
                },
            ],
        ],
    )
    def test_show_filter_summary_runs(self, cli, workflows):
        path_string = cli.data_stored_at

        FileHandlerForTesting(path_string).store_json_file("workflows.json", workflows)

        result = cli.runner.invoke(
            main,
            [
                "pipelines",
                "summary",
                "--start-date",
                "2021-10-01",
                "--end-date",
                "2021-01-02",
            ],
        )
        assert "No workflow runs available" in result.output
