from pathlib import Path
from click.testing import CliRunner
from providers.github.prs.cli.fetch_prs import command as fetch_prs
from providers.github.prs.cli.view_prs_by_author import prs_by_author
from providers.github.prs.cli.view_average_review_time_by_author import (
    review_time_by_author,
)
from providers.github.prs.cli.view_summary import summary
from providers.github.prs.cli.average_of_prs_open_by import average_prs_open_by


current_directory = Path(__file__).parent
print(current_directory)


def test_can_run_fetch_prs_command():
    runner = CliRunner()
    result = runner.invoke(fetch_prs, ["--help"])
    assert result.exit_code == 0
    assert "Show this message and exit" in result.output


def test_prs_by_author():
    runner = CliRunner()
    result = runner.invoke(
        prs_by_author, ["--top", "5", "--labels", "bug", "--out-file", "output.png"]
    )
    assert result.exit_code == 0


def test_review_time_by_author():
    runner = CliRunner()
    result = runner.invoke(
        review_time_by_author,
        ["--top", "5", "--labels", "enhancement", "--out-file", "output.png"],
    )
    assert result.exit_code == 0


def test_summary():
    runner = CliRunner()
    result = runner.invoke(
        summary,
        [
            "--csv",
            "data.csv",
            "--start-date",
            "2023-01-01",
            "--end-date",
            "2023-12-31",
            "--output",
            "text",
        ],
    )
    assert result.exit_code == 0


def test_execute():
    runner = CliRunner()
    result = runner.invoke(fetch_prs, ["--months", "3", "--force", "true"])
    assert result.exit_code == 0


def test_average_prs_open_by():
    runner = CliRunner()
    result = runner.invoke(
        average_prs_open_by,
        [
            "--out-file",
            "output.png",
            "--author",
            "john",
            "--labels",
            "bug",
            "--aggregate-by",
            "month",
        ],
    )
    assert result.exit_code == 0
