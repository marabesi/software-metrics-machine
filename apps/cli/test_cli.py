from apps.cli.main import main


class TestCliCommands:

    def test_can_run_cli_help(self, cli):
        result = cli.invoke(main, ["--help"])
        assert result.exit_code == 0
        assert "Show this message and exit" in result.output
