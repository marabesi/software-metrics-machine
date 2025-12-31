from fastapi.testclient import TestClient

from software_metrics_machine.apps.rest.main import app as rest_main  # type: ignore[attr-defined]
from tests.builders import (
    github_workflows_data,
    job_with_single_step_completed_successfully,
    single_run,
)
from tests.pipeline_builder import PipelineJobBuilder

client = TestClient(rest_main)


class TestRestRoutes:

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
                "commits": "abcdef1234567890",
                "daily_counts": 1,
                "days": "2023-10-01",
                "links": "https://github.com/aaa/json-tool/actions/runs/11",
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
                "0": ["id", 1],
                "1": ["path", "/workflows/build.yml"],
                "2": ["name", "CI"],
                "3": ["short_name", "build"],
                "4": ["created_at", "2023-10-01T12:00:00Z"],
                "5": ["run_started_at", "2023-10-01T12:01:00Z"],
                "6": ["updated_at", "2023-10-01T12:10:00Z"],
                "7": ["event", "push"],
                "8": ["head_branch", "main"],
                "9": ["status", "completed"],
                "10": ["conclusion", "success"],
                "11": ["jobs", []],
                "12": ["html_url", "https://github.com/aaa/json-tool/actions/runs/11"],
                "13": ["duration_in_minutes", 0.0],
                "14": [
                    "head_commit",
                    {
                        "id": "abcdef1234567890",
                    },
                ],
            }
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
