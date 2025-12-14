from software_metrics_machine.apps.cli import main

from tests.builders import single_deployment_frequency
from tests.pipeline_builder import PipelineBuilder, PipelineJobBuilder

import pandas as pd

pd.set_option("display.max_columns", None)
pd.set_option("display.max_seq_items", None)
pd.set_option("display.width", None)


class TestWorkflowsDeploymentFrequencyCliCommands:

    def test_deployment_frequency_executes_successfully(self, cli):
        cli.storage.store_pipelines_with(single_deployment_frequency())
        cli.storage.store_jobs_with(
            [
                PipelineJobBuilder()
                .with_id(105)
                .with_run_id(1)
                .with_name("Deploy")
                .with_conclusion("success")
                .with_started_at("2023-10-01T09:05:00Z")
                .with_completed_at("2023-10-01T09:10:00Z")
                .build(),
            ],
        )
        result = cli.runner.invoke(
            main,
            [
                "pipelines",
                "deployment-frequency",
                "--job-name",
                "Deploy",
            ],
        )
        assert 0 == result.exit_code

    def test_deployment_frequency_loads_a_single_run(self, cli):
        cli.storage.store_pipelines_with(single_deployment_frequency())
        cli.storage.store_jobs_with(
            [
                PipelineJobBuilder()
                .with_id(105)
                .with_run_id(1)
                .with_name("Deploy")
                .with_conclusion("success")
                .with_started_at("2023-10-01T09:05:00Z")
                .with_completed_at("2023-10-01T09:10:00Z")
                .build(),
            ],
        )
        result = cli.runner.invoke(
            main,
            [
                "pipelines",
                "deployment-frequency",
                "--job-name",
                "Deploy",
            ],
        )

        # days     weeks   months  daily_counts  weekly_counts  monthly_counts
        assert (
            "2023-10-01  2023-W39  2023-10             1              1               1"
            in result.output
        )

    def test_prints_deployment_frequency_for_deploy(self, cli):
        cli.storage.store_pipelines_with(single_deployment_frequency())
        cli.storage.store_jobs_with(
            [
                PipelineJobBuilder()
                .with_id(105)
                .with_run_id(1)
                .with_name("Deploy")
                .with_conclusion("success")
                .with_started_at("2023-10-01T09:05:00Z")
                .with_completed_at("2023-10-01T09:10:00Z")
                .build(),
            ],
        )
        result = cli.runner.invoke(
            main,
            [
                "pipelines",
                "deployment-frequency",
                "--job-name",
                "Deploy",
            ],
        )
        # days     weeks   months  daily_counts  weekly_counts  monthly_counts commits
        assert (
            "2023-10-01  2023-W39  2023-10             1              1               1  abcdef1234567890  http://link-to-pipeline"
            in result.output
        )

    def test_different_deploys_by_week_by_month_and_by_day(self, cli):
        cli.storage.store_pipelines_with(
            [
                PipelineBuilder()
                .with_id(1)
                .with_name("Deploy")
                .with_path("/workflows/deploy.yml")
                .with_conclusion("success")
                .with_created_at("2023-01-01T10:00:00Z")
                .build(),
                PipelineBuilder()
                .with_id(2)
                .with_name("Deploy")
                .with_path("/workflows/deploy.yml")
                .with_conclusion("success")
                .with_created_at("2023-01-02T10:00:00Z")
                .build(),
                PipelineBuilder()
                .with_id(3)
                .with_name("Deploy")
                .with_path("/workflows/deploy.yml")
                .with_conclusion("success")
                .with_created_at("2023-01-03T10:00:00Z")
                .build(),
                PipelineBuilder()
                .with_id(4)
                .with_name("Deploy")
                .with_path("/workflows/deploy.yml")
                .with_conclusion("success")
                .with_created_at("2023-01-04T10:00:00Z")
                .build(),
            ]
        )
        cli.storage.store_jobs_with(
            [
                PipelineJobBuilder()
                .with_run_id(1)
                .with_name("Deploy")
                .with_conclusion("success")
                .with_started_at("2023-01-01T09:05:00Z")
                .with_completed_at("2023-01-01T09:10:00Z")
                .build(),
                PipelineJobBuilder()
                .with_run_id(2)
                .with_name("Deploy")
                .with_conclusion("success")
                .with_started_at("2023-01-02T09:05:00Z")
                .with_completed_at("2023-01-02T09:10:00Z")
                .build(),
                PipelineJobBuilder()
                .with_run_id(3)
                .with_name("Deploy")
                .with_conclusion("success")
                .with_started_at("2023-01-03T09:05:00Z")
                .with_completed_at("2023-01-03T09:10:00Z")
                .build(),
                PipelineJobBuilder()
                .with_run_id(4)
                .with_name("Deploy")
                .with_conclusion("success")
                .with_started_at("2023-01-04T09:05:00Z")
                .with_completed_at("2023-01-04T09:10:00Z")
                .build(),
            ]
        )

        result = cli.runner.invoke(
            main,
            [
                "pipelines",
                "deployment-frequency",
                "--job-name",
                "Deploy",
            ],
        )

        assert (
            "2023-01-01  2023-W01  2023-01             1            3.0             4.0"
            in result.output
        )
        assert (
            "2023-01-02  2023-W52      NaN             1            1.0             NaN"
            in result.output
        )
        assert (
            "2023-01-03       NaN      NaN             1            NaN             NaN"
            in result.output
        )
        assert (
            "2023-01-04       NaN      NaN             1            NaN             NaN"
            in result.output
        )
