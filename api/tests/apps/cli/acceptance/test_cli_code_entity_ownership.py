from unittest.mock import patch

import pytest

from software_metrics_machine.apps.cli import main

from tests.csv_builder import CSVBuilder


class TestCliCodeEntityOwnershipCommands:

    @pytest.fixture(scope="function", autouse=True)
    def reset_mock_run(self):
        with patch(
            "software_metrics_machine.core.infrastructure.run.Run.run_command"
        ) as mock_run:
            mock_run.reset_mock()
            yield mock_run

    def test_can_run_entity_ownership_without_data_available(self, cli):
        result = cli.runner.invoke(
            main,
            ["code", "entity-ownership"],
        )
        assert "No entity ownership data available to plot" in result.output

    def test_list_the_number_of_revision_found_for_entity_ownership(self, cli):

        csv_data = """entity,author,added,deleted
file.txt,John,10,2"""
        cli.storage.store_csv_file("entity-ownership.csv", csv_data)

        result = cli.runner.invoke(
            main,
            ["code", "entity-ownership"],
        )

        assert "Found 1 row for entity ownership" in result.output

    def test_filter_entity_ownership_by_author(self, cli):

        csv_data = """entity,author,added,deleted
file.txt,John,10,2"""
        cli.storage.store_csv_file("entity-ownership.csv", csv_data)

        result = cli.runner.invoke(
            main,
            [
                "code",
                "entity-ownership",
                "--authors",
                "Jane",
            ],
        )

        assert "Found 0 row for entity ownership" in result.output

    def test_defines_include_only_argument(self, cli):
        cli.storage.store_csv_file("entity-ownership.csv", "")
        result = cli.runner.invoke(
            main,
            ["code", "entity-ownership", "--help"],
        )
        assert "--include-only" in result.output

    def test_includes_only_specified_paths_for_analysis(self, cli):
        csv_data = (
            CSVBuilder(headers=["entity", "author", "added", "deleted"])
            .extend_rows(
                [
                    ["src/another.txt", "John", 10, 2],
                    ["application/file.ts", "Maria", 10, 2],
                ]
            )
            .build()
        )
        cli.storage.store_csv_file("entity-ownership.csv", csv_data)
        result = cli.runner.invoke(
            main,
            ["code", "entity-ownership", "--include-only", "src/**"],
        )
        assert (
            "Applied include only file patterns: ['src/**'], remaining rows: 1"
            in result.output
        )

    def test_print_entity_ownership(self, cli):
        csv_data = (
            CSVBuilder(headers=["entity", "author", "added", "deleted"])
            .extend_rows(
                [
                    ["src/another.txt", "John", 10, 2],
                ]
            )
            .build()
        )
        cli.storage.store_csv_file("entity-ownership.csv", csv_data)
        result = cli.runner.invoke(
            main,
            ["code", "entity-ownership"],
        )
        # entity     short_entity author  added  deleted  total
        assert (
            "src/another.txt  src/another.txt   John     10        2     12"
            in result.output
        )
