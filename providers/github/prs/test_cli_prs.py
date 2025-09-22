from click.testing import CliRunner
from providers.github.prs.cli.fetch_prs import command as fetch_prs


def test_can_run_fetch_prs_command():
    runner = CliRunner()
    result = runner.invoke(fetch_prs, ["--help"])
    assert result.exit_code == 0
    assert "Show this message and exit" in result.output
