import pytest
from software_metrics_machine.apps.cli import main
from tests.builders import single_run

from tests.pipeline_builder import PipelineBuilder


class TestPipelineSummaryCliCommands:

    @pytest.mark.parametrize(
        "workflows, expected_output",
        [
            (single_run(), "Total runs: 1"),
            (single_run(), "Most failed run: N/A"),
        ],
    )
    def test_summary_pipeline(self, cli, workflows, expected_output):
        cli.storage.store_pipelines_with(workflows)

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
                PipelineBuilder().with_created_at("2020-01-01T12:00:00Z").build(),
            ],
        ],
    )
    def test_show_filter_summary_runs(self, cli, workflows):
        cli.storage.store_pipelines_with(workflows)

        result = cli.runner.invoke(
            main,
            [
                "pipelines",
                "summary",
                "--start-date",
                "2021-01-01",
                "--end-date",
                "2021-10-02",
            ],
        )
        assert "Total runs: 0" in result.output
