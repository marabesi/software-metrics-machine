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


class TestCodeParameterPassing:
    """Verify code endpoints pass query parameters correctly to viewers."""

    @patch('software_metrics_machine.apps.rest.main.PairingIndex')
    def test_pairing_index_parameters(self, mock_index_class, cli):
        """Verify /code/pairing-index passes all expected parameters."""
        mock_index = MagicMock()
        mock_index.get_pairing_index.return_value = _Result()
        mock_index_class.return_value = mock_index

        client.get(
            "/code/pairing-index?"
            "start_date=2023-01-01&"
            "end_date=2023-12-31&"
            "authors=john,jane"
        )

        mock_index.get_pairing_index.assert_called_once_with(
            start_date="2023-01-01",
            end_date="2023-12-31",
            authors="john,jane",
        )

    @patch('software_metrics_machine.apps.rest.main.EntityChurnViewer')
    def test_entity_churn_parameters(self, mock_viewer_class, cli):
        """Verify /code/entity-churn passes all expected parameters."""
        mock_viewer = MagicMock()
        mock_viewer.render.return_value = _Result()
        mock_viewer_class.return_value = mock_viewer

        client.get(
            "/code/entity-churn?"
            "top=50&"
            "ignore_files=test,spec&"
            "include_only=src&"
            "start_date=2023-01-01&"
            "end_date=2023-12-31"
        )

        mock_viewer.render.assert_called_once()
        call_kwargs = mock_viewer.render.call_args[1]

        assert call_kwargs['top_n'] == 50
        assert call_kwargs['ignore_files'] == "test,spec"
        assert call_kwargs['include_only'] == "src"
        assert call_kwargs['start_date'] == "2023-01-01"
        assert call_kwargs['end_date'] == "2023-12-31"

    @patch('software_metrics_machine.apps.rest.main.CodeChurnViewer')
    def test_code_churn_parameters(self, mock_viewer_class, cli):
        """Verify /code/code-churn passes date parameters."""
        mock_viewer = MagicMock()
        mock_viewer.render.return_value = _Result()
        mock_viewer_class.return_value = mock_viewer

        client.get(
            "/code/code-churn?"
            "start_date=2023-01-01&"
            "end_date=2023-12-31"
        )

        mock_viewer.render.assert_called_once_with(
            start_date="2023-01-01",
            end_date="2023-12-31",
        )

    @patch('software_metrics_machine.apps.rest.main.CouplingViewer')
    def test_coupling_parameters(self, mock_viewer_class, cli):
        """Verify /code/coupling passes all expected parameters."""
        mock_viewer = MagicMock()
        mock_viewer.render.return_value = _Result()
        mock_viewer_class.return_value = mock_viewer

        client.get(
            "/code/coupling?"
            "top=30&"
            "ignore_files=vendor&"
            "include_only=app"
        )

        mock_viewer.render.assert_called_once_with(
            ignore_files="vendor",
            ignore_pattern=None,
            include_only="app",
            top=30,
        )

    @patch('software_metrics_machine.apps.rest.main.EntityEffortViewer')
    def test_entity_effort_parameters(self, mock_viewer_class, cli):
        """Verify /code/entity-effort passes all expected parameters."""
        mock_viewer = MagicMock()
        mock_viewer.render_treemap.return_value = _Result()
        mock_viewer_class.return_value = mock_viewer

        client.get(
            "/code/entity-effort?"
            "top_n=15&"
            "ignore_files=tests&"
            "include_only=core&"
            "start_date=2023-01-01&"
            "end_date=2023-12-31"
        )

        mock_viewer.render_treemap.assert_called_once_with(
            top_n=15,
            ignore_files="tests",
            ignore_pattern=None,
            include_only="core",
        )

    @patch('software_metrics_machine.apps.rest.main.EntityOnershipViewer')
    def test_entity_ownership_parameters(self, mock_viewer_class, cli):
        """Verify /code/entity-ownership passes all expected parameters."""
        mock_viewer = MagicMock()
        mock_viewer.render.return_value = _Result()
        mock_viewer_class.return_value = mock_viewer

        client.get(
            "/code/entity-ownership?"
            "top_n=40&"
            "ignore_files=dist&"
            "authors=diana&"
            "include_only=lib&"
            "start_date=2023-01-01&"
            "end_date=2023-12-31"
        )

        mock_viewer.render.assert_called_once_with(
            top_n=40,
            ignore_files="dist",
            ignore_pattern=None,
            authors="diana",
            include_only="lib",
        )

    @patch('software_metrics_machine.apps.rest.main.EntityChurnViewer')
    def test_entity_churn_with_null_top(self, mock_viewer_class, cli):
        """Verify /code/entity-churn works when top parameter is None."""
        mock_viewer = MagicMock()
        mock_viewer.render.return_value = _Result()
        mock_viewer_class.return_value = mock_viewer

        client.get("/code/entity-churn")

        mock_viewer.render.assert_called_once()
        call_kwargs = mock_viewer.render.call_args[1]

        assert call_kwargs['top_n'] is None

    @patch('software_metrics_machine.apps.rest.main.CouplingViewer')
    def test_coupling_with_default_top(self, mock_viewer_class, cli):
        """Verify /code/coupling defaults top to 20."""
        mock_viewer = MagicMock()
        mock_viewer.render.return_value = _Result()
        mock_viewer_class.return_value = mock_viewer

        client.get("/code/coupling")

        mock_viewer.render.assert_called_once_with(
            ignore_files=None,
            ignore_pattern=None,
            include_only=None,
            top=20,
        )

    @patch('software_metrics_machine.apps.rest.main.EntityEffortViewer')
    def test_entity_effort_with_default_top_n(self, mock_viewer_class, cli):
        """Verify /code/entity-effort defaults top_n to 30."""
        mock_viewer = MagicMock()
        mock_viewer.render_treemap.return_value = _Result()
        mock_viewer_class.return_value = mock_viewer

        client.get("/code/entity-effort")

        mock_viewer.render_treemap.assert_called_once_with(
            top_n=30,
            ignore_files=None,
            ignore_pattern=None,
            include_only=None,
        )


class TestCodeIgnorePatternParameter:
    """Verify code endpoints pass ignore_pattern parameter to collaborators.

    NOTE: Tests in this class will only run for endpoints that accept ignore_pattern.
    If ignore_pattern is not defined in an endpoint's signature, no test is created for it.
    Never use if statements inside tests.
    """

    @patch('software_metrics_machine.apps.rest.main.EntityChurnViewer')
    def test_entity_churn_with_ignore_pattern(self, mock_viewer_class, cli):
        """Verify /code/entity-churn passes ignore_pattern to viewer."""
        mock_viewer = MagicMock()
        mock_viewer.render.return_value = _Result()
        mock_viewer_class.return_value = mock_viewer

        client.get(
            "/code/entity-churn?"
            "ignore_pattern=*.test.ts&"
            "include_only=src"
        )

        mock_viewer.render.assert_called_once()
        call_kwargs = mock_viewer.render.call_args[1]

        assert call_kwargs['ignore_pattern'] == "*.test.ts"

    @patch('software_metrics_machine.apps.rest.main.CouplingViewer')
    def test_coupling_with_ignore_pattern(self, mock_viewer_class, cli):
        """Verify /code/coupling passes ignore_pattern to viewer."""
        mock_viewer = MagicMock()
        mock_viewer.render.return_value = _Result()
        mock_viewer_class.return_value = mock_viewer

        client.get("/code/coupling?ignore_pattern=dist/**&top=25")

        mock_viewer.render.assert_called_once()
        call_kwargs = mock_viewer.render.call_args[1]

        assert call_kwargs['ignore_pattern'] == "dist/**"

    @patch('software_metrics_machine.apps.rest.main.EntityEffortViewer')
    def test_entity_effort_with_ignore_pattern(self, mock_viewer_class, cli):
        """Verify /code/entity-effort passes ignore_pattern to viewer."""
        mock_viewer = MagicMock()
        mock_viewer.render_treemap.return_value = _Result()
        mock_viewer_class.return_value = mock_viewer

        client.get(
            "/code/entity-effort?"
            "ignore_pattern=node_modules&"
            "top_n=20"
        )

        mock_viewer.render_treemap.assert_called_once()
        call_kwargs = mock_viewer.render_treemap.call_args[1]

        assert call_kwargs['ignore_pattern'] == "node_modules"

    @patch('software_metrics_machine.apps.rest.main.EntityOnershipViewer')
    def test_entity_ownership_with_ignore_pattern(self, mock_viewer_class, cli):
        """Verify /code/entity-ownership passes ignore_pattern to viewer."""
        mock_viewer = MagicMock()
        mock_viewer.render.return_value = _Result()
        mock_viewer_class.return_value = mock_viewer

        client.get(
            "/code/entity-ownership?"
            "ignore_pattern=docs/**&"
            "authors=alice&"
            "top_n=15"
        )

        mock_viewer.render.assert_called_once()
        call_kwargs = mock_viewer.render.call_args[1]

        assert call_kwargs['ignore_pattern'] == "docs/**"
