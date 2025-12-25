from software_metrics_machine.apps.cli import main


class TestTest_codeVsProductionCode:

    def test_lack_of_data_to_compte_metric(self, cli):
        result = cli.runner.invoke(
            main,
            [
                "code",
                "metadata",
                "--metric",
                "test_code_vs_production_code",
                "--test-patterns",
                "tests/*",
                "--ignore",
                ".git/*",
            ],
        )
        assert "No production and test files found in the repository" in result.output

    def test_detects_average_of_commits_with_test_files_touched(self, cli, git):
        git.create_file("production.py", "print('Hello World')")
        git.create_file("tests/test_print.py", "def empty_test():\n    pass")
        git.stage_all_file()
        git.commit().with_message("Add production file").with_author(
            "Dev A", "a@a.com"
        ).execute()

        result = cli.runner.invoke(
            main,
            [
                "code",
                "metadata",
                "--metric",
                "test_code_vs_production_code",
                "--ignore",
                ".git/*",
                "--test-patterns",
                "tests/*",
            ],
        )

        assert (
            "Average fraction of production-file commits that also touch test files: 100.00%"
            in result.output
        )

    def test_no_test_files_computed(self, cli, git):
        git.create_file("production.py", "print('Hello World')")
        git.create_file("print.py", "def empty_test():\n    pass")
        git.stage_all_file()
        git.commit().with_message("Add production file").with_author(
            "Dev A", "a@a.com"
        ).execute()

        git.create_file("production.py", "print('Hello World')")
        git.create_file("print.py", "def empty_test():\n    pass")
        git.stage_all_file()
        git.commit().with_message("Add production file 2").with_author(
            "Dev A", "a@a.com"
        ).execute()

        result = cli.runner.invoke(
            main,
            [
                "code",
                "metadata",
                "--metric",
                "test_code_vs_production_code",
                "--ignore",
                ".git/*",
                "--test-patterns",
                "tests/*",
            ],
        )

        assert (
            "Average fraction of production-file commits that also touch test files: 0.00%"
            in result.output
        )
