from software_metrics_machine.apps.cli import main
import pytest

from tests.builders import single_deployment_frequency
from tests.pipeline_builder import PipelineJobBuilder


class TestWorkflowsDeploymentFrequencyCliCommands:

    @pytest.fixture(autouse=True)
    def setup_data(self, cli):
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

    def test_deployment_frequency_executes_successfully(self, cli):
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

    def test_prints_deployment_frequency(self, cli):
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
