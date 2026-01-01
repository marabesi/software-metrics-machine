from fastapi.testclient import TestClient

from software_metrics_machine.apps.rest.main import app as rest_main  # type: ignore[attr-defined]

client = TestClient(rest_main)


class TestConfigurationRoute:

    def test_get_configuration_returns_200(self, cli):
        resp = client.get("/configuration")
        assert resp.status_code == 200

    def test_get_configuration_returns_stored_configuration(self, cli):
        resp = client.get("/configuration")
        result = resp.json()

        assert "result" in result
        config = result["result"]

        # Verify expected configuration fields are present
        assert "git_provider" in config
        assert "github_repository" in config
        assert "git_repository_location" in config
        assert "store_data" in config
        assert "deployment_frequency_target_pipeline" in config
        assert "deployment_frequency_target_job" in config
        assert "main_branch" in config
        assert "dashboard_start_date" in config
        assert "dashboard_end_date" in config
        assert "dashboard_color" in config
        assert "logging_level" in config
