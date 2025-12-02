from fastapi.testclient import TestClient

from software_metrics_machine.apps.rest.main import app as rest_main
from tests.csv_builder import CSVBuilder

client = TestClient(rest_main)


class TestRestRoutes:

    def test_pairing_index_route(self, git):
        git.commit().with_author("John Doe", "john@example.com").execute()
        git.commit().with_author("Alice", "alice@example.com").execute()
        resp = client.get("/code/pairing-index")
        assert resp.status_code == 200
        assert resp.json() == {
            "paired_commits": 0,
            "pairing_index": 0.0,
            "total_analyzed_commits": 2,
        }

    def test_entity_churn_route(self, cli):
        csv_data = (
            CSVBuilder(headers=["entity", "added", "deleted", "commits"])
            .extend_rows(
                [
                    ["src/another.txt", 10, 2, 1],
                    ["application/file.ts", 10, 2, 1],
                ]
            )
            .build()
        )
        cli.storage.store_csv_file("entity-churn.csv", csv_data)
        resp = client.get("/code/entity-churn")
        assert resp.status_code == 200
        assert resp.json() == [
            {
                "added": 10,
                "commits": 1,
                "deleted": 2,
                "entity": "src/another.txt",
                "entity_short": "src/another.txt",
                "total_churn": 12,
            },
            {
                "added": 10,
                "commits": 1,
                "deleted": 2,
                "entity": "application/file.ts",
                "entity_short": "application/file.ts",
                "total_churn": 12,
            },
        ]

    def test_code_churn_route(self, cli):
        csv_data = """date,added,deleted,commits
2022-06-17,10,10,2"""
        cli.storage.store_csv_file("abs-churn.csv", csv_data)
        resp = client.get("/code/code-churn")
        assert resp.status_code == 200
        assert resp.json() == [
            {
                "date": "2022-06-17",
                "type": "Added",
                "value": 10,
            },
            {
                "date": "2022-06-17",
                "type": "Deleted",
                "value": 10,
            },
        ]

    def test_pipeline_summary_route(self):
        resp = client.get("/pipelines/summary")
        assert resp.status_code == 200
        assert resp.json() == {
            "completed": 0,
            "first_run": {},
            "in_progress": 0,
            "last_run": {},
            "most_failed": None,
            "queued": 0,
            "runs_by_workflow": {},
            "total_runs": 0,
            "unique_workflows": 0,
        }
