"""
REST layer tests to verify query parameters are passed correctly to business logic.

These tests use mocking to isolate the REST layer and verify that:
1. HTTP request parameters are received by endpoints
2. Parameters are passed to the underlying view/viewer classes
3. Parameters are transported correctly from request → business logic
"""
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from software_metrics_machine.apps.rest.main import app as rest_main

client = TestClient(rest_main)


class _Result(dict):
    """Result object that's both dict-like (JSON-serializable) and has .data property."""
    def __init__(self, data=None):
        super().__init__()
        self._data = data if data is not None else []
        # Initialize dict with empty content for JSON serialization
        self.update({})

    @property
    def data(self):
        return self._data


class TestPipelineParameterPassing:
    """Verify pipeline endpoints pass query parameters correctly to view classes."""

    @patch('software_metrics_machine.apps.rest.main.ViewPipelineByStatus')
    def test_pipelines_by_status_parameters(self, mock_view_class, cli):
        """Verify /pipelines/by-status passes start_date, end_date, workflow_path."""
        mock_view = MagicMock()
        mock_view.main.return_value = _Result()
        mock_view_class.return_value = mock_view

        client.get("/pipelines/by-status?start_date=2023-01-01&end_date=2023-12-31&workflow_path=/workflows/test.yml")

        mock_view.main.assert_called_once_with(
            workflow_path="/workflows/test.yml",
            start_date="2023-01-01",
            end_date="2023-12-31",
        )

    @patch('software_metrics_machine.apps.rest.main.ViewJobsByStatus')
    def test_pipeline_jobs_by_status_parameters(self, mock_view_class, cli):
        """Verify /pipelines/jobs-by-status passes all expected parameters."""
        mock_view = MagicMock()
        mock_view.main.return_value = _Result()
        mock_view_class.return_value = mock_view

        client.get(
            "/pipelines/jobs-by-status?"
            "start_date=2023-01-01&"
            "end_date=2023-12-31&"
            "job_name=Build&"
            "workflow_path=/workflows/test.yml&"
            "with_pipeline=true&"
            "aggregate_by_week=true&"
            "raw_filters={\"status\":\"success\"}"
        )

        mock_view.main.assert_called_once()
        call_kwargs = mock_view.main.call_args[1]

        assert call_kwargs['start_date'] == "2023-01-01"
        assert call_kwargs['end_date'] == "2023-12-31"
        assert call_kwargs['job_name'] == "Build"
        assert call_kwargs['workflow_path'] == "/workflows/test.yml"
        assert call_kwargs['with_pipeline'] is True
        assert call_kwargs['aggregate_by_week'] is True
        assert call_kwargs['pipeline_raw_filters'] == '{"status":"success"}'

    @patch('software_metrics_machine.apps.rest.main.WorkflowRunSummary')
    def test_pipeline_summary_parameters(self, mock_view_class, cli):
        """Verify /pipelines/summary passes start_date and end_date."""
        mock_view = MagicMock()
        mock_view.print_summary.return_value = _Result()
        mock_view_class.return_value = mock_view

        client.get("/pipelines/summary?start_date=2023-01-01&end_date=2023-12-31")

        mock_view.print_summary.assert_called_once_with(
            max_workflows=None,
            start_date="2023-01-01",
            end_date="2023-12-31",
            output_format="json",
        )

    @patch('software_metrics_machine.apps.rest.main.ViewPipelineExecutionRunsDuration')
    def test_pipeline_runs_duration_parameters(self, mock_view_class, cli):
        """Verify /pipelines/runs-duration passes all expected parameters."""
        mock_view = MagicMock()
        mock_view.main.return_value = _Result()
        mock_view_class.return_value = mock_view

        client.get(
            "/pipelines/runs-duration?"
            "start_date=2023-01-01&"
            "end_date=2023-12-31&"
            "workflow_path=/workflows/test.yml&"
            "max_runs=50&"
            "raw_filters={\"status\":\"failed\"}"
        )

        mock_view.main.assert_called_once_with(
            workflow_path="/workflows/test.yml",
            start_date="2023-01-01",
            end_date="2023-12-31",
            max_runs=50,
            raw_filters='{"status":"failed"}',
        )

    @patch('software_metrics_machine.apps.rest.main.ViewDeploymentFrequency')
    def test_pipeline_deployment_frequency_parameters(self, mock_view_class, cli):
        """Verify /pipelines/deployment-frequency passes all expected parameters."""
        mock_view = MagicMock()
        mock_view.plot.return_value = _Result()
        mock_view_class.return_value = mock_view

        client.get(
            "/pipelines/deployment-frequency?"
            "start_date=2023-01-01&"
            "end_date=2023-12-31&"
            "workflow_path=/workflows/test.yml&"
            "job_name=Deploy"
        )

        mock_view.plot.assert_called_once_with(
            workflow_path="/workflows/test.yml",
            job_name="Deploy",
            start_date="2023-01-01",
            end_date="2023-12-31",
        )

    @patch('software_metrics_machine.apps.rest.main.ViewWorkflowRunsByWeekOrMonth')
    def test_pipeline_runs_by_parameters(self, mock_view_class, cli):
        """Verify /pipelines/runs-by passes all expected parameters."""
        mock_view = MagicMock()
        mock_view.main.return_value = _Result()
        mock_view_class.return_value = mock_view

        client.get(
            "/pipelines/runs-by?"
            "start_date=2023-01-01&"
            "end_date=2023-12-31&"
            "aggregate_by=month&"
            "workflow_path=/workflows/test.yml&"
            "raw_filters={\"branch\":\"main\"}&"
            "include_defined_only=true"
        )

        mock_view.main.assert_called_once()
        call_kwargs = mock_view.main.call_args[1]

        assert call_kwargs['aggregate_by'] == "month"
        assert call_kwargs['workflow_path'] == "/workflows/test.yml"
        assert call_kwargs['start_date'] == "2023-01-01"
        assert call_kwargs['end_date'] == "2023-12-31"
        assert call_kwargs['raw_filters'] == '{"branch":"main"}'
        assert call_kwargs['include_defined_only'] is True

    @patch('software_metrics_machine.apps.rest.main.ViewJobsByAverageTimeExecution')
    def test_pipeline_jobs_average_time_parameters(self, mock_view_class, cli):
        """Verify /pipelines/jobs-average-time passes all expected parameters."""
        mock_view = MagicMock()
        mock_view.main.return_value = _Result()
        mock_view_class.return_value = mock_view

        client.get(
            "/pipelines/jobs-average-time?"
            "start_date=2023-01-01&"
            "end_date=2023-12-31&"
            "workflow_path=/workflows/test.yml&"
            "raw_filters={\"status\":\"success\"}&"
            "top=30&"
            "exclude_jobs=cleanup&"
            "job_name=Test&"
            "pipeline_raw_filters={\"branch\":\"main\"}"
        )

        mock_view.main.assert_called_once()
        call_kwargs = mock_view.main.call_args[1]

        assert call_kwargs['workflow_path'] == "/workflows/test.yml"
        assert call_kwargs['raw_filters'] == '{"status":"success"}'
        assert call_kwargs['top'] == 30
        assert call_kwargs['exclude_jobs'] == "cleanup"
        assert call_kwargs['start_date'] == "2023-01-01"
        assert call_kwargs['end_date'] == "2023-12-31"
        assert call_kwargs['job_name'] == "Test"
        assert call_kwargs['pipeline_raw_filters'] == '{"branch":"main"}'


class TestPullRequestParameterPassing:
    """Verify PR endpoints pass query parameters correctly to view classes."""

    @patch('software_metrics_machine.apps.rest.main.PrViewSummary')
    def test_pull_request_summary_parameters(self, mock_view_class, cli):
        """Verify /pull-requests/summary passes start_date and end_date."""
        mock_view = MagicMock()
        mock_view.main.return_value = _Result()
        mock_view_class.return_value = mock_view

        client.get("/pull-requests/summary?start_date=2023-01-01&end_date=2023-12-31")

        mock_view.main.assert_called_once_with(
            csv=None,
            start_date="2023-01-01",
            end_date="2023-12-31",
            output_format="json",
        )

    @patch('software_metrics_machine.apps.rest.main.ViewOpenPrsThroughTime')
    def test_pull_request_through_time_parameters(self, mock_view_class, cli):
        """Verify /pull-requests/through-time passes all expected parameters."""
        mock_view = MagicMock()
        mock_view.main.return_value = _Result()
        mock_view_class.return_value = mock_view

        client.get(
            "/pull-requests/through-time?"
            "start_date=2023-01-01&"
            "end_date=2023-12-31&"
            "authors=john,jane"
        )

        mock_view.main.assert_called_once_with(
            title="Open Pull Requests Through Time",
            authors="john,jane",
            start_date="2023-01-01",
            end_date="2023-12-31",
        )

    @patch('software_metrics_machine.apps.rest.main.convert_result_data')
    @patch('software_metrics_machine.apps.rest.main.ViewPrsByAuthor')
    def test_pull_requests_by_author_parameters(self, mock_view_class, mock_convert, cli):
        """Verify /pull-requests/by-author passes all expected parameters."""
        mock_convert.return_value = []  # Return JSON-serializable list
        mock_view = MagicMock()
        mock_view.plot_top_authors.return_value = _Result()
        mock_view_class.return_value = mock_view

        client.get(
            "/pull-requests/by-author?"
            "start_date=2023-01-01&"
            "end_date=2023-12-31&"
            "labels=bug,feature&"
            "top=15&"
            "raw_filters={\"status\":\"open\"}"
        )

        mock_view.plot_top_authors.assert_called_once()
        call_kwargs = mock_view.plot_top_authors.call_args[1]

        assert call_kwargs['title'] == "Pull Requests by Author"
        assert call_kwargs['start_date'] == "2023-01-01"
        assert call_kwargs['end_date'] == "2023-12-31"
        assert call_kwargs['labels'] == "bug,feature"
        assert call_kwargs['top'] == 15
        assert call_kwargs['raw_filters'] == '{"status":"open"}'

    @patch('software_metrics_machine.apps.rest.main.ViewAverageReviewTimeByAuthor')
    def test_pull_requests_average_review_time_parameters(self, mock_view_class, cli):
        """Verify /pull-requests/average-review-time passes all expected parameters."""
        mock_view = MagicMock()
        mock_view.plot_average_open_time.return_value = _Result()
        mock_view_class.return_value = mock_view

        client.get(
            "/pull-requests/average-review-time?"
            "start_date=2023-01-01&"
            "end_date=2023-12-31&"
            "labels=bug,feature&"
            "authors=alice,bob&"
            "top=15&"
            "raw_filters={\"status\":\"merged\"}"
        )

        mock_view.plot_average_open_time.assert_called_once()
        call_kwargs = mock_view.plot_average_open_time.call_args[1]

        assert call_kwargs['title'] == "Average Review Time by Author"
        assert call_kwargs['top'] == 15
        assert call_kwargs['labels'] == "bug,feature"
        assert call_kwargs['start_date'] == "2023-01-01"
        assert call_kwargs['end_date'] == "2023-12-31"
        assert call_kwargs['authors'] == "alice,bob"
        assert call_kwargs['raw_filters'] == '{"status":"merged"}'


class TestDefaultParameterHandling:
    """Verify endpoints correctly handle default parameter values."""

    @patch('software_metrics_machine.apps.rest.main.ViewPipelineByStatus')
    def test_pipelines_by_status_with_no_parameters(self, mock_view_class, cli):
        """Verify /pipelines/by-status works with no optional parameters."""
        mock_view = MagicMock()
        mock_view.main.return_value = _Result()
        mock_view_class.return_value = mock_view

        client.get("/pipelines/by-status")

        mock_view.main.assert_called_once_with(
            workflow_path=None,
            start_date=None,
            end_date=None,
        )

    @patch('software_metrics_machine.apps.rest.main.ViewJobsByStatus')
    def test_pipeline_jobs_by_status_with_defaults(self, mock_view_class, cli):
        """Verify /pipelines/jobs-by-status uses correct defaults."""
        mock_view = MagicMock()
        mock_view.main.return_value = _Result()
        mock_view_class.return_value = mock_view

        client.get("/pipelines/jobs-by-status")

        call_kwargs = mock_view.main.call_args[1]

        assert call_kwargs['with_pipeline'] is False
        assert call_kwargs['aggregate_by_week'] is False

    @patch('software_metrics_machine.apps.rest.main.ViewWorkflowRunsByWeekOrMonth')
    def test_pipeline_runs_by_with_default_aggregate(self, mock_view_class, cli):
        """Verify /pipelines/runs-by defaults aggregate_by to 'week'."""
        mock_view = MagicMock()
        mock_view.main.return_value = _Result()
        mock_view_class.return_value = mock_view

        client.get("/pipelines/runs-by")

        call_kwargs = mock_view.main.call_args[1]

        assert call_kwargs['aggregate_by'] == "week"

    @patch('software_metrics_machine.apps.rest.main.ViewPipelineExecutionRunsDuration')
    def test_pipeline_runs_duration_with_default_max_runs(self, mock_view_class, cli):
        """Verify /pipelines/runs-duration defaults max_runs to 100."""
        mock_view = MagicMock()
        mock_view.main.return_value = _Result()
        mock_view_class.return_value = mock_view

        client.get("/pipelines/runs-duration")

        call_kwargs = mock_view.main.call_args[1]

        assert call_kwargs['max_runs'] == 100


class TestPullRequestAdvancedParameterPassing:
    """Verify advanced PR endpoints pass parameters correctly to repository methods."""

    @patch('software_metrics_machine.apps.rest.main.create_prs_repository')
    def test_pull_requests_average_open_by_parameters(self, mock_repo_factory, cli):
        """Verify /pull-requests/average-open-by passes parameters correctly."""
        mock_repo = MagicMock()
        mock_repo.average_by.return_value = ([], [])
        mock_repo_factory.return_value = mock_repo

        client.get(
            "/pull-requests/average-open-by?"
            "start_date=2023-01-01&"
            "end_date=2023-12-31&"
            "aggregate_by=month&"
            "labels=bug,feature"
        )

        mock_repo.average_by.assert_called_once()
        call_kwargs = mock_repo.average_by.call_args[1]

        assert call_kwargs['by'] == "month"
        assert call_kwargs['labels'] == "bug,feature"

    @patch('software_metrics_machine.apps.rest.main.create_prs_repository')
    def test_pull_requests_average_comments_parameters(self, mock_repo_factory, cli):
        """Verify /pull-requests/average-comments passes parameters correctly."""
        mock_repo = MagicMock()
        mock_repo.average_comments.return_value = {"period": [], "y": []}
        mock_repo_factory.return_value = mock_repo

        client.get(
            "/pull-requests/average-comments?"
            "start_date=2023-01-01&"
            "end_date=2023-12-31&"
            "aggregate_by=month&"
            "labels=urgent"
        )

        mock_repo.average_comments.assert_called_once()
        call_kwargs = mock_repo.average_comments.call_args[1]

        assert call_kwargs['aggregate_by'] == "month"

    @patch('software_metrics_machine.apps.rest.main.create_prs_repository')
    def test_pull_requests_average_open_by_with_default_aggregate(self, mock_repo_factory, cli):
        """Verify /pull-requests/average-open-by defaults aggregate_by to 'week'."""
        mock_repo = MagicMock()
        mock_repo.average_by.return_value = ([], [])
        mock_repo_factory.return_value = mock_repo

        client.get("/pull-requests/average-open-by")

        mock_repo.average_by.assert_called_once()
        call_kwargs = mock_repo.average_by.call_args[1]

        assert call_kwargs['by'] == "week"

    @patch('software_metrics_machine.apps.rest.main.create_prs_repository')
    def test_pull_requests_average_comments_with_default_aggregate(self, mock_repo_factory, cli):
        """Verify /pull-requests/average-comments defaults aggregate_by to 'week'."""
        mock_repo = MagicMock()
        mock_repo.average_comments.return_value = {"period": [], "y": []}
        mock_repo_factory.return_value = mock_repo

        client.get("/pull-requests/average-comments")

        mock_repo.average_comments.assert_called_once()
        call_kwargs = mock_repo.average_comments.call_args[1]

        assert call_kwargs['aggregate_by'] == "week"
