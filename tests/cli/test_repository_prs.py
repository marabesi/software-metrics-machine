import pytest
from infrastructure.configuration.configuration_builder import (
    ConfigurationBuilder,
    Driver,
)
from providers.github.prs.prs_repository import LoadPrs
from unittest.mock import patch

from tests.builders import as_json_string


class TestRepositoryPrs:
    @pytest.fixture(scope="function", autouse=True)
    def setup(self):
        self.repository = LoadPrs(
            configuration=ConfigurationBuilder(driver=Driver.IN_MEMORY).build()
        )

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
                configuration=ConfigurationBuilder(driver=Driver.IN_MEMORY).build()
            )
            all_prs = repository.read_file_if_exists("prs.json")

            assert len(all_prs) == 1
            assert all_prs[0]["id"] == 1
            assert all_prs[0]["title"] == "Fix bug"
            assert all_prs[0]["author"] == "user1"
            assert all_prs[0]["created_at"] == "2025-09-20"

    def test_merged(self):
        self.repository.all_prs = [
            {"id": 1, "merged_at": "2025-09-20"},
            {"id": 2, "merged_at": None},
        ]
        merged_prs = self.repository.merged()
        assert len(merged_prs) == 1
        assert merged_prs[0]["id"] == 1

    def test_closed(self):
        self.repository.all_prs = [
            {"id": 1, "closed_at": "2025-09-20", "merged_at": None},
            {"id": 2, "closed_at": None},
        ]
        closed_prs = self.repository.closed()
        assert len(closed_prs) == 1
        assert closed_prs[0]["id"] == 1

    def test_average_by_month(self):
        self.repository.all_prs = [
            {"created_at": "2025-09-01T00:00:00Z", "merged_at": "2025-09-10T00:00:00Z"},
            {"created_at": "2025-09-15T00:00:00Z", "merged_at": "2025-09-20T00:00:00Z"},
        ]

        months, averages = self.repository.average_by_month(prs=self.repository.all_prs)

        assert months == ["2025-09"]
        assert averages == [7.0]

    def test_average_by_week(self):
        self.repository.all_prs = [
            {"created_at": "2025-09-01T00:00:00Z", "merged_at": "2025-09-06T00:00:00Z"},
            {"created_at": "2025-09-15T00:00:00Z", "merged_at": "2025-09-20T00:00:00Z"},
        ]

        weeks, averages = self.repository.average_by_week(prs=self.repository.all_prs)

        assert weeks == ["2025-W36", "2025-W38"]
        assert averages == [5.0, 5.0]

    def test_filter_prs_by_labels(self):
        prs = [
            {"id": 1, "labels": [{"name": "bug"}]},
            {"id": 2, "labels": [{"name": "enhancement"}]},
        ]

        filtered = self.repository.filter_prs_by_labels(prs, ["bug"])

        assert len(filtered) == 1
        assert filtered[0]["id"] == 1

    def test_get_unique_authors(self):
        self.repository.all_prs = [
            {"user": {"login": "user1"}},
            {"user": {"login": "user2"}},
            {"user": {"login": "user1"}},
        ]

        authors = self.repository.get_unique_authors()

        assert authors == ["user1", "user2"]

    def test_prs_with_filters_star_date(self):
        prs_fetched = as_json_string(
            [
                {
                    "id": 1,
                    "user": {"login": "user1"},
                    "created_at": "2025-09-01T00:00:00Z",
                },
                {
                    "id": 2,
                    "user": {"login": "user2"},
                    "created_at": "2025-09-20T00:00:00Z",
                },
            ]
        )
        with patch(
            "infrastructure.base_repository.BaseRepository.read_file_if_exists",
            return_value=prs_fetched,
        ):
            repository = LoadPrs(
                configuration=ConfigurationBuilder(driver=Driver.IN_MEMORY).build()
            )
            filters = {"start_date": "2025-09-01", "end_date": "2025-09-15"}

            filtered = repository.prs_with_filters(filters)

            assert len(filtered) == 1
            assert filtered[0]["id"] == 1

    def test_prs_with_filters_end_date(self):
        prs_fetched = as_json_string(
            [
                {
                    "id": 1,
                    "user": {"login": "user1"},
                    "created_at": "2025-09-01T00:00:00Z",
                },
                {
                    "id": 2,
                    "user": {"login": "user2"},
                    "created_at": "2025-09-15T00:00:00Z",
                },
            ]
        )
        with patch(
            "infrastructure.base_repository.BaseRepository.read_file_if_exists",
            return_value=prs_fetched,
        ):
            repository = LoadPrs(
                configuration=ConfigurationBuilder(driver=Driver.IN_MEMORY).build()
            )

            filters = {"start_date": "2025-09-10", "end_date": "2025-09-15"}
            filtered = repository.prs_with_filters(filters)

            assert len(filtered) == 1
            assert filtered[0]["id"] == 2

    def test_get_unique_labels(self):
        self.repository.all_prs = [
            {"labels": [{"name": "bug"}, {"name": "enhancement"}]},
            {"labels": [{"name": "bug"}]},
        ]

        labels = self.repository.get_unique_labels()

        assert len(labels) == 2
        assert labels[0]["label_name"] == "bug"
        assert labels[0]["prs_count"] == 2
        assert labels[1]["label_name"] == "enhancement"
        assert labels[1]["prs_count"] == 1
