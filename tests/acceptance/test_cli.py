from software_metrics_machine.apps.cli import main


class TestCliCommands:

    def test_can_run_cli_help(self, cli):
        result = cli.runner.invoke(main, ["--help"])
        assert 0 == result.exit_code
        assert "Show this message and exit" in result.output
