import pytest
from software_metrics_machine.core.prs.prs_repository import PrsRepository
from unittest.mock import patch
from tests.in_memory_configuration import InMemoryConfiguration
from tests.builders import as_json_string
from tests.prs_builder import PullRequestBuilder
from tests.prs_comment_builder import PullRequestCommentsBuilder


class TestRepositoryPrs:
    @pytest.fixture(scope="function", autouse=True)
    def setup(self):
        self.configuration = InMemoryConfiguration(".")
        self.repository = PrsRepository(configuration=self.configuration)

    def test_load_provided_prs_data_when_exists(self):
        mocked_prs_data = [
            {
                "id": 1,
                "title": "Fix bug",
                "author": "user1",
                "created_at": "2025-09-20",
            },
        ]

        with patch(
            "software_metrics_machine.core.prs.prs_repository.PrsRepository.read_file_if_exists",
            return_value=mocked_prs_data,
        ):
            repository = PrsRepository(configuration=self.configuration)
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

    @pytest.mark.parametrize(
        "prs, expected_weeks, expected_averages, aggregate_by",
        [
            pytest.param(
                [
                    PullRequestBuilder()
                    .with_created_at("2011-01-26T19:01:12Z")
                    .with_closed_at("2011-01-26T19:02:12Z")
                    .build(),
                ],
                [],
                [],
                "week",
                id="no merged prs",
            ),
            pytest.param(
                [
                    PullRequestBuilder()
                    .with_created_at("2025-09-01T00:00:00Z")
                    .mark_merged("2025-09-06T00:00:00Z")
                    .build(),
                    PullRequestBuilder()
                    .with_created_at("2025-09-15T00:00:00Z")
                    .mark_merged("2025-09-20T00:00:00Z")
                    .build(),
                ],
                ["2025-W36", "2025-W38"],
                [5.0, 5.0],
                "week",
                id="two prs with 5 days open each in different weeks",
            ),
            pytest.param(
                [
                    PullRequestBuilder()
                    .with_created_at("2025-09-01T00:00:00Z")
                    .mark_merged("2025-09-03T00:00:00Z")
                    .build(),
                    PullRequestBuilder()
                    .with_created_at("2025-09-02T00:00:00Z")
                    .mark_merged("2025-09-04T00:00:00Z")
                    .build(),
                ],
                ["2025-W36"],
                [2.0],
                "week",
                id="two prs with 2 days open each in same week",
            ),
        ],
    )
    def test_calculate_averages_for_prs(
        self, prs, expected_weeks, expected_averages, aggregate_by
    ):
        self.repository.all_prs = prs
        average = self.repository.average_by(aggregate_by, prs=prs)

        assert average[0] == expected_weeks
        assert average[1] == expected_averages

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

        months, averages = self.repository.average_by(
            by="month", prs=self.repository.all_prs
        )

        assert months == ["2025-09"]
        assert averages == [7.0]

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
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            return_value=prs_fetched,
        ):
            repository = PrsRepository(configuration=self.configuration)
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
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            return_value=prs_fetched,
        ):
            repository = PrsRepository(configuration=self.configuration)

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

    @pytest.mark.parametrize(
        "prs_data, expected_count",
        [
            (
                {
                    "prs": [
                        {
                            "id": 1,
                            "user": {"login": "user1"},
                            "created_at": "2025-09-01T00:00:00Z",
                        },
                    ],
                    "comments": None,
                },
                0,
            ),
            (
                {
                    "prs": [PullRequestBuilder().with_number(101).build()],
                    "comments": [
                        PullRequestCommentsBuilder()
                        .with_number(101)
                        .with_body("Looks good")
                        .with_pull_request_url("/101")
                        .build(),
                    ],
                },
                1,
            ),
        ],
    )
    def test_associate_pull_requests_with_comments(self, prs_data, expected_count):

        def mocked_read_file_if_exists(file):
            if file == "prs.json":
                return as_json_string(prs_data["prs"])
            if file == "prs_review_comments.json":
                return as_json_string(prs_data["comments"])
            raise FileNotFoundError(f"File {file} not found")

        with patch(
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            configuration = InMemoryConfiguration(".")
            repository = PrsRepository(configuration=configuration)

            prs_with_comments = repository.prs_with_filters()

            assert expected_count == len(prs_with_comments[0]["comments"])
