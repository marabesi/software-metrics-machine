from apps.cli.main import main
from unittest.mock import patch


class TestWorkflowsCliCommands:
    def fetch_workflows_fake_response(self):
        return [
            {
                "created_at": "2011-01-26T19:01:12Z",
                "closed_at": "2011-01-26T19:01:12Z",
            }
        ]

    def test_can_run_fetch_workflows_command(self, cli):
        result = cli.invoke(main, ["workflows", "--help"])
        assert result.exit_code == 0
        assert "Show this message and exit" in result.output

    def test_deployment_frequency_by_author(self, cli):
        deployment_frequency = [
            {
                "id": 1,
                "path": "/workflows/build.yml",
                "status": "success",
                "created_at": "2023-10-01T12:00:00Z",
                "jobs": [
                    {
                        "name": "Deploy",
                        "conclusion": "success",
                        "created_at": "2023-10-01T12:05:00Z",
                    }
                ],
            },
        ]

        with patch("requests.get") as mock_get:
            mock_get.return_value.json.return_value = deployment_frequency
            mock_get.return_value.status_code = 200

            result = cli.invoke(
                main,
                [
                    "workflows",
                    "deployment-frequency",
                    "--job-name",
                    "Deploy",
                    "--out-file",
                    "deployment_frequency_out.png",
                ],
            )
            assert result.exit_code == 0
            assert "Loaded 2 jobs" in result.output
