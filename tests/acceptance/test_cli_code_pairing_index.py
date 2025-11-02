from apps.cli.main import main


class TestCliCodePairingIndexCommands:

    def test_defines_pairing_index_command(self, cli):
        result = cli.runner.invoke(
            main,
            ["code", "pairing-index", "--help"],
        )
        assert "Calculate pairing index for a git repository" in result.output
        assert result.stderr == ""
