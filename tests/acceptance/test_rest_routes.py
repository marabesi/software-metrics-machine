from fastapi.testclient import TestClient

from software_metrics_machine.apps.rest.main import app as rest_main
from tests.csv_builder import CSVBuilder
from tests.builders import (
    github_workflows_data,
    job_with_single_step_completed_successfully,
    single_run,
)
from tests.pipeline_builder import PipelineJobBuilder
from tests.prs_builder import PullRequestBuilder

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

    def test_coupling_route(self, cli):
        # create real coupling CSV so endpoint uses the actual viewer
        csv_data = (
            CSVBuilder(headers=["entity", "coupled", "degree", "average-revs"])
            .extend_rows([["E", "X", 3, 1]])
            .build()
        )
        cli.storage.store_csv_file("coupling.csv", csv_data)
        resp = client.get("/code/coupling")
        data = resp.json()

        assert resp.status_code == 200
        assert data == [
            {
                "entity": "E",
                "coupled": "X",
                "degree": 3,
                "average-revs": 1,
            }
        ]

    def test_entity_effort_route(self, cli):
        csv_data = (
            CSVBuilder(headers=["entity", "author", "author-revs", "total-revs"])
            .extend_rows([["E", "alice", 1, 10]])
            .build()
        )
        cli.storage.store_csv_file("entity-effort.csv", csv_data)
        resp = client.get("/code/entity-effort")
        data = resp.json()
        assert resp.status_code == 200
        assert data == [
            {
                "entity": "E",
                "total-revs": 10,
            },
        ]

    def test_entity_ownership_route(self, cli):
        csv_data = (
            CSVBuilder(headers=["entity", "author", "added", "deleted"])
            .extend_rows([["E", "alice", 5, 0]])
            .build()
        )
        cli.storage.store_csv_file("entity-ownership.csv", csv_data)
        resp = client.get("/code/entity-ownership")
        data = resp.json()
        assert resp.status_code == 200
        assert data == [
            {
                "added": 5,
                "author": "alice",
                "deleted": 0,
                "entity": "E",
                "entity_short": "E",
                "total": 5,
            },
        ]

    def test_pipelines_by_status_route(self, cli):
        # persist workflows data so pipelines repository loads real runs
        cli.storage.store_pipelines_with(github_workflows_data())
        resp = client.get("/pipelines/by-status")
        data = resp.json()
        assert resp.status_code == 200
        assert data == [
            {
                "Count": 4,
                "Status": "completed",
            },
            {
                "Count": 1,
                "Status": "failed",
            },
        ]

    def test_pipeline_jobs_by_status_route(self, cli):
        cli.storage.store_pipelines_with(github_workflows_data())
        cli.storage.store_jobs_with(job_with_single_step_completed_successfully)
        resp = client.get("/pipelines/jobs-by-status")
        data = resp.json()
        assert resp.status_code == 200
        assert data == [
            {
                "Count": 1,
                "Status": "success",
            },
        ]

    def test_pipeline_summary_route(self, cli):
        cli.storage.store_pipelines_with(github_workflows_data())
        resp = client.get("/pipelines/summary")
        assert resp.status_code == 200
        assert resp.json() == {
            "total_runs": 5,
            "completed": 4,
            "in_progress": 0,
            "queued": 0,
            "unique_workflows": 1,
            "runs_by_workflow": {"CI": {"count": 5, "path": "/workflows/tests.yml"}},
            "first_run": {
                "created_at": "01 Oct 2023, 12:00",
                "run_started_at": "01 Oct 2023, 12:01",
                "updated_at": "01 Oct 2023, 12:10",
            },
            "last_run": {
                "created_at": "01 Jun 2025, 12:00",
                "run_started_at": "01 Jun 2025, 12:00",
                "updated_at": "01 Jun 2025, 13:00",
            },
            "most_failed": "dynamic/workflows/dependabot (1)",
        }

    def test_pipeline_runs_duration_route(self, cli):
        jobs = [
            PipelineJobBuilder()
            .with_id(105)
            .with_run_id(1)
            .with_name("Deploy")
            .with_conclusion("success")
            .with_started_at("2023-10-01T09:05:00Z")
            .with_completed_at("2023-10-01T09:10:00Z")
            .build(),
            PipelineJobBuilder()
            .with_id(106)
            .with_run_id(1)
            .with_name("Build")
            .with_conclusion("success")
            .with_started_at("2023-10-01T09:05:00Z")
            .with_completed_at("2023-10-01T09:10:00Z")
            .build(),
        ]
        cli.storage.store_pipelines_with(single_run())
        cli.storage.store_jobs_with(jobs)

        resp = client.get("/pipelines/runs-duration")

        assert resp.status_code == 200
        assert resp.json() == [
            {
                "name": "/workflows/build.yml",
                "total_jobs": 2,
                "total_runs": 1,
                "value": 5.0,
            }
        ]

    def test_pipeline_deployment_frequency_route(self, cli):
        jobs = [
            PipelineJobBuilder()
            .with_id(105)
            .with_run_id(1)
            .with_name("Deploy")
            .with_conclusion("success")
            .with_started_at("2023-10-01T09:05:00Z")
            .with_completed_at("2023-10-01T09:10:00Z")
            .build(),
            PipelineJobBuilder()
            .with_id(106)
            .with_run_id(1)
            .with_name("Build")
            .with_conclusion("success")
            .with_started_at("2023-10-01T09:05:00Z")
            .with_completed_at("2023-10-01T09:10:00Z")
            .build(),
        ]
        cli.storage.store_pipelines_with(single_run())
        cli.storage.store_jobs_with(jobs)
        resp = client.get(
            "/pipelines/deployment-frequency?workflow_path=/workflows/build.yml&job_name=Build"
        )
        assert resp.status_code == 200
        assert resp.json() == [
            {
                "daily_counts": 1,
                "days": "2023-10-01",
                "monthly_counts": 1,
                "months": "2023-10",
                "weekly_counts": 1,
                "weeks": "2023-W39",
            }
        ]

    def test_pipeline_runs_by_route(self, cli):
        cli.storage.store_pipelines_with(single_run())
        resp = client.get("/pipelines/runs-by")
        assert resp.status_code == 200
        assert resp.json() == [
            {
                "0": [
                    "id",
                    1,
                ],
                "1": [
                    "path",
                    "/workflows/build.yml",
                ],
                "10": [
                    "jobs",
                    [],
                ],
                "11": [
                    "html_url",
                    "https://github.com/aaa/json-tool/actions/runs/11",
                ],
                "12": [
                    "duration_in_minutes",
                    0.0,
                ],
                "2": [
                    "name",
                    "CI",
                ],
                "3": [
                    "created_at",
                    "2023-10-01T12:00:00Z",
                ],
                "4": [
                    "run_started_at",
                    "2023-10-01T12:01:00Z",
                ],
                "5": [
                    "updated_at",
                    "2023-10-01T12:10:00Z",
                ],
                "6": [
                    "event",
                    "push",
                ],
                "7": [
                    "head_branch",
                    "main",
                ],
                "8": [
                    "status",
                    "completed",
                ],
                "9": [
                    "conclusion",
                    "success",
                ],
            },
        ]

    def test_pipeline_jobs_average_time_route(self, cli):
        jobs = [
            PipelineJobBuilder()
            .with_id(105)
            .with_run_id(1)
            .with_name("Deploy")
            .with_conclusion("success")
            .with_started_at("2023-10-01T09:05:00Z")
            .with_completed_at("2023-10-01T09:10:00Z")
            .build(),
            PipelineJobBuilder()
            .with_id(106)
            .with_run_id(1)
            .with_name("Build")
            .with_conclusion("success")
            .with_started_at("2023-10-01T09:05:00Z")
            .with_completed_at("2023-10-01T09:10:00Z")
            .build(),
        ]
        cli.storage.store_pipelines_with(single_run())
        cli.storage.store_jobs_with(jobs)
        resp = client.get("/pipelines/jobs-average-time")
        assert resp.status_code == 200
        assert resp.json() == {
            "result": [
                {
                    "0": "Deploy",
                    "1": 5.0,
                },
                {
                    "0": "Build",
                    "1": 5.0,
                },
            ],
        }

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
