from apps.cli.main import main

from tests.file_handler_for_testing import FileHandlerForTesting


class TestWorkflowsDeploymentFrequencyCliCommands:

    def test_deployment_frequency_by_job(self, cli):
        path_string = cli.data_stored_at
        single_deployment_frequency = [
            {
                "id": 1,
                "path": "/workflows/build.yml",
                "status": "success",
                "created_at": "2023-10-01T12:00:00Z",
            },
        ]
        FileHandlerForTesting(path_string).store_json_file(
            "workflows.json", single_deployment_frequency
        )

        FileHandlerForTesting(path_string).store_json_file(
            "jobs.json",
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

        result = cli.runner.invoke(
            main,
            [
                "pipelines",
                "deployment-frequency",
                "--job-name",
                "Deploy",
                "--out-file",
                "deployment_frequency_out.png",
            ],
        )
        assert 0 == result.exit_code
        assert "Loaded 1 runs" in result.output
