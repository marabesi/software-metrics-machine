from providers.github.prs.prs_repository import LoadPrs
from unittest.mock import patch


def test_load_provided_data_when_exists():
    mocked_prs_data = [
        {"id": 1, "title": "Fix bug", "author": "user1", "created_at": "2025-09-20"},
    ]

    with patch(
        "providers.github.prs.prs_repository.LoadPrs.read_file_if_exists",
        return_value=mocked_prs_data,
    ):
        repository = LoadPrs()
        all_prs = repository.read_file_if_exists("prs.json")

        assert len(all_prs) == 1
        assert all_prs[0]["id"] == 1
        assert all_prs[0]["title"] == "Fix bug"
        assert all_prs[0]["author"] == "user1"
        assert all_prs[0]["created_at"] == "2025-09-20"
