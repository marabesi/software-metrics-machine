import pytest
from infrastructure.configuration.configuration_builder import (
    ConfigurationBuilder,
    Driver,
)
from providers.github.prs.prs_repository import LoadPrs
from unittest.mock import patch


class TestRepositoryPrs:
    @pytest.fixture(scope="function", autouse=True)
    def mock_os_env(self, monkeypatch):
        """Fixture to mock os.getenv to always return 'faked'."""
        monkeypatch.setattr("os.getenv", lambda key, default=None: "faked")

    def test_load_provided_data_when_exists(self):
        mocked_prs_data = [
            {
                "id": 1,
                "title": "Fix bug",
                "author": "user1",
                "created_at": "2025-09-20",
            },
        ]

        with patch(
            "providers.github.prs.prs_repository.LoadPrs.read_file_if_exists",
            return_value=mocked_prs_data,
        ):
            repository = LoadPrs(
                configuration=ConfigurationBuilder(driver=Driver.CLI).build()
            )
            all_prs = repository.read_file_if_exists("prs.json")

            assert len(all_prs) == 1
            assert all_prs[0]["id"] == 1
            assert all_prs[0]["title"] == "Fix bug"
            assert all_prs[0]["author"] == "user1"
            assert all_prs[0]["created_at"] == "2025-09-20"
