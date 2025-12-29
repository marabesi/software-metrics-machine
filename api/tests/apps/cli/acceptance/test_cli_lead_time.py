from software_metrics_machine.apps.cli import main
from tests.builders import single_run


class TestJobsCliCommands:

    def test_cli_lead_time_via_runner(self, cli):
        cli.storage.store_pipelines_with(single_run())

        result = cli.runner.invoke(
            main,
            [
                "pipelines",
                "lead-time",
                "--pipeline",
                ".github/workflows/deploy.yml",
                "--job-name",
                "deploy",
            ],
        )
        assert result.exit_code == 0
