from unittest.mock import patch

import pytest

from apps.cli.main import main


class TestCliCodeEntityOwnershipCommands:

    @pytest.fixture(scope="function", autouse=True)
    def reset_mock_run(self):
        with patch("core.infrastructure.run.Run.run_command") as mock_run:
            mock_run.reset_mock()
            yield mock_run

    def test_can_run_entity_effort_without_data_available(self, cli):
        result = cli.runner.invoke(
            main,
            ["code", "entity-effort", "--out-file", "entity_effort.png"],
        )
        assert "No entity effort data available to plot" in result.output
