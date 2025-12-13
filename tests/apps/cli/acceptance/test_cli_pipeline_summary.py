import pytest
from software_metrics_machine.apps.cli import main
from tests.builders import single_run

from tests.pipeline_builder import PipelineBuilder


class TestPipelineSummaryCliCommands:

    @pytest.mark.parametrize(
        "workflows, command, expected_output",
        [
            pytest.param(
                single_run(),
                [
                    "pipelines",
                    "summary",
                ],
                "Total runs: 1",
                id="counts the number of runs",
            ),
            pytest.param(
                single_run(),
                [
                    "pipelines",
                    "summary",
                ],
                "Most failed run: N/A",
                id="no runs that failed to show",
            ),
            pytest.param(
                [
                    PipelineBuilder()
                    .with_id(1)
                    .with_path("/workflows/build.yml")
                    .with_status("failure")
                    .with_conclusion("failure")
                    .with_created_at("2023-10-01T12:00:00Z")
                    .with_run_started_at("2023-10-01T12:01:00Z")
                    .with_updated_at("2023-10-01T12:10:00Z")
                    .with_event("push")
                    .with_head_branch("main")
                    .with_jobs([])
                    .build(),
                ],
                [
                    "pipelines",
                    "summary",
                ],
                "Most failed run: /workflows/build.yml (1)",
                id="most_failed_single_pipeline within date range",
            ),
            pytest.param(
                [
                    PipelineBuilder()
                    .with_id(1)
                    .with_path("/workflows/build.yml")
                    .with_status("failure")
                    .with_conclusion("failure")
                    .with_created_at("2023-10-01T12:00:00Z")
                    .with_run_started_at("2023-10-01T12:01:00Z")
                    .with_updated_at("2023-10-01T12:10:00Z")
                    .with_event("push")
                    .with_head_branch("main")
                    .with_jobs([])
                    .build(),
                    PipelineBuilder()
                    .with_id(1)
                    .with_path("/workflows/build.yml")
                    .with_status("completed")
                    .with_conclusion("success")
                    .with_created_at("2024-01-03T12:00:00Z")
                    .with_run_started_at("2024-01-03T12:01:00Z")
                    .with_updated_at("2024-01-03T12:10:00Z")
                    .with_event("push")
                    .with_head_branch("main")
                    .with_jobs([])
                    .build(),
                ],
                [
                    "pipelines",
                    "summary",
                    "--start-date",
                    "2024-01-01",
                    "--end-date",
                    "2024-12-31",
                ],
                "Most failed run: N/A",
                id="most_failed_single_pipeline outside date range",
            ),
            pytest.param(
                single_run(),
                [
                    "pipelines",
                    "summary",
                    "--raw-filters",
                    "event=pull_request",
                ],
                "Total runs: 0",
                id="counts the number of runs filtered by raw-filters",
            ),
        ],
    )
    def test_summary_pipeline(self, cli, workflows, command, expected_output):
        cli.storage.store_pipelines_with(workflows)

        result = cli.runner.invoke(main, command)
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
