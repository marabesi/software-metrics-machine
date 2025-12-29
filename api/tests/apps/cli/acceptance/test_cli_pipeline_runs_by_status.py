import pytest
from software_metrics_machine.apps.cli import main

from tests.builders import github_workflows_data
from tests.pipeline_builder import PipelineBuilder


class TestPipelineRunsByStatusCliCommands:

    @pytest.mark.parametrize(
        "workflow_runs, expected",
        [
            (
                [
                    PipelineBuilder()
                    .with_status("completed")
                    .with_path("/workflows/tests.yml")
                    .build()
                ],
                "Total workflow runs after filters: 1",
            ),
            (
                [
                    PipelineBuilder()
                    .with_status("completed")
                    .with_path("/workflows/tests.yml")
                    .build()
                ],
                "completed      1",
            ),
        ],
    )
    def test_should_filter_by_workflow_path(self, cli, workflow_runs, expected):
        cli.storage.store_pipelines_with(workflow_runs)

        result = cli.runner.invoke(
            main,
            [
                "pipelines",
                "pipeline-by-status",
                "--workflow-path",
                "/workflows/tests.yml",
            ],
        )

        assert expected in result.output

    @pytest.mark.parametrize(
        "command, expected",
        [
            (
                [
                    "pipelines",
                    "pipeline-by-status",
                    "--start-date",
                    "2023-10-01",
                    "--end-date",
                    "2023-12-01",
                ],
                "completed      3",
            ),
            (
                [
                    "pipelines",
                    "pipeline-by-status",
                    "--raw-filters",
                    "status=failed",
                ],
                "failed      1",
            ),
        ],
    )
    def test_should_filter_by_multiple_parameters(self, cli, command, expected):
        workflow_runs = github_workflows_data()

        cli.storage.store_pipelines_with(workflow_runs)

        result = cli.runner.invoke(main, command)

        assert expected in result.output
