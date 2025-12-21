from software_metrics_machine.apps.cli import main


class TestTest_codeVsProductionCode:

    def test_detects_average_of_commits_with_test_files_touched(self, cli):
        result = cli.runner.invoke(
            main, ["code", "metadata", "--metric", "test_code_vs_production_code"]
        )
        assert "No production files with commits found to analyze." in result.output
