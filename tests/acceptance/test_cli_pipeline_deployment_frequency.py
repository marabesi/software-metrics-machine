from software_metrics_machine.apps.cli import main
import pytest

from tests.file_handler_for_testing import FileHandlerForTesting
from tests.builders import single_deployment_frequency


class TestWorkflowsDeploymentFrequencyCliCommands:

    @pytest.fixture(autouse=True)
    def setup_data(self, cli):
        path_string = cli.data_stored_at
        FileHandlerForTesting(path_string).store_pipelines_with(
            single_deployment_frequency()
        )

        FileHandlerForTesting(path_string).store_jobs_with(
            [
                {
                    "id": 105,
                    "run_id": 1,
                    "name": "Deploy",
                    "conclusion": "success",
                    "started_at": "2023-10-01T09:05:00Z",
                    "completed_at": "2023-10-01T09:10:00Z",
                },
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
        assert "Loaded 1 runs" in result.output
