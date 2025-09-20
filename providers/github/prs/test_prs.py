from click.testing import CliRunner
from providers.github.prs.cli.fetch_prs import command as fetch_prs


def test_hello_world():
    runner = CliRunner()
    result = runner.invoke(fetch_prs, ["Peter"])
    assert result.exit_code == 0
    assert result.output == "Hello Peter!\n"
