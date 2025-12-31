from fastapi.testclient import TestClient

from software_metrics_machine.apps.rest.main import app as rest_main  # type: ignore[attr-defined]
from tests.prs_builder import PullRequestBuilder

client = TestClient(rest_main)


class TestRestRoutes:

    def test_pull_requests_summary_route(self, cli):
        cli.storage.store_prs_with(
            [
                PullRequestBuilder()
                .with_number(1029)
                .with_title("Add files via upload")
                .with_author("eriirfos-eng")
                .with_created_at("2025-09-02T00:50:00Z")
                .build(),
                PullRequestBuilder()
                .with_number(1164)
                .with_title("Add Repository Tree Navigation Tool")
                .with_author("natagdunbar")
                .with_created_at("2025-09-30T19:12:17Z")
                .build(),
            ]
        )
        resp = client.get("/pull-requests/summary")
        assert resp.status_code == 200
        assert resp.json() == {
            "result": {
                "avg_comments_per_pr": 0.0,
                "closed_prs": 0,
                "first_comment_time_stats": {
                    "avg_hours": None,
                    "max_hours": None,
                    "median_hours": None,
                    "min_hours": None,
                    "prs_with_comment": 0,
                    "prs_without_comment": 2,
                },
                "first_pr": {
                    "closed": None,
                    "created": "2025-09-02T00:50:00Z",
                    "login": "eriirfos-eng",
                    "merged": None,
                    "number": 1029,
                    "title": "Add files via upload",
                },
                "labels": [],
                "last_pr": {
                    "closed": None,
                    "created": "2025-09-30T19:12:17Z",
                    "login": "natagdunbar",
                    "merged": None,
                    "number": 1164,
                    "title": "Add Repository Tree Navigation Tool",
                },
                "merged_prs": 0,
                "most_commented_pr": {
                    "comments_count": 0,
                    "login": None,
                    "number": None,
                    "title": None,
                },
                "top_commenter": {
                    "comments_count": 0,
                    "login": None,
                },
                "top_themes": [],
                "total_prs": 2,
                "unique_authors": 2,
                "unique_labels": 0,
                "without_conclusion": 2,
            },
        }

    def test_pull_request_through_time_route(self, cli):
        cli.storage.store_prs_with(
            [
                PullRequestBuilder()
                .with_number(1029)
                .with_title("Add files via upload")
                .with_author("eriirfos-eng")
                .with_created_at("2025-09-02T00:50:00Z")
                .build(),
                PullRequestBuilder()
                .with_number(1164)
                .with_title("Add Repository Tree Navigation Tool")
                .with_author("natagdunbar")
                .with_created_at("2025-09-30T19:12:17Z")
                .build(),
            ]
        )
        resp = client.get("/pull-requests/through-time")
        assert resp.status_code == 200
        assert resp.json() == {
            "result": [
                {
                    "count": 1,
                    "date": "2025-09-02",
                    "kind": "Opened",
                },
                {
                    "count": 0,
                    "date": "2025-09-02",
                    "kind": "Closed",
                },
                {
                    "count": 1,
                    "date": "2025-09-30",
                    "kind": "Opened",
                },
                {
                    "count": 0,
                    "date": "2025-09-30",
                    "kind": "Closed",
                },
            ],
        }

    def test_pull_requests_by_author_route(self, cli):
        cli.storage.store_prs_with(
            [
                PullRequestBuilder()
                .with_number(1)
                .with_title("First PR")
                .with_author("alice")
                .with_created_at("2025-09-01T00:00:00Z")
                .build(),
                PullRequestBuilder()
                .with_number(2)
                .with_title("Second PR")
                .with_author("alice")
                .with_created_at("2025-09-02T00:00:00Z")
                .build(),
                PullRequestBuilder()
                .with_number(3)
                .with_title("Third PR")
                .with_author("bob")
                .with_created_at("2025-09-03T00:00:00Z")
                .build(),
            ]
        )
        resp = client.get("/pull-requests/by-author")
        assert resp.status_code == 200
        result = resp.json()
        assert "result" in result
        # Alice should have 2 PRs, Bob should have 1
        authors_data = result["result"]
        assert len(authors_data) == 2
        alice_data = next(item for item in authors_data if item["author"] == "alice")
        bob_data = next(item for item in authors_data if item["author"] == "bob")
        assert alice_data["count"] == 2
        assert bob_data["count"] == 1

    def test_pull_requests_average_review_time_route(self, cli):
        cli.storage.store_prs_with(
            [
                PullRequestBuilder()
                .with_number(1)
                .with_title("Quick PR")
                .with_author("alice")
                .with_created_at("2025-09-01T00:00:00Z")
                .mark_merged("2025-09-02T00:00:00Z")
                .build(),
                PullRequestBuilder()
                .with_number(2)
                .with_title("Slow PR")
                .with_author("bob")
                .with_created_at("2025-09-01T00:00:00Z")
                .mark_merged("2025-09-06T00:00:00Z")
                .build(),
                PullRequestBuilder()
                .with_number(3)
                .with_title("Not merged")
                .with_author("charlie")
                .with_created_at("2025-09-01T00:00:00Z")
                .build(),
            ]
        )
        resp = client.get("/pull-requests/average-review-time")
        assert resp.status_code == 200
        result = resp.json()
        assert "result" in result
        # Only merged PRs should be included
        review_data = result["result"]
        assert len(review_data) == 2
        # Bob should have 5 days, Alice should have 1 day
        bob_data = next(item for item in review_data if item["author"] == "bob")
        alice_data = next(item for item in review_data if item["author"] == "alice")
        assert bob_data["avg_days"] == 5.0
        assert alice_data["avg_days"] == 1.0
