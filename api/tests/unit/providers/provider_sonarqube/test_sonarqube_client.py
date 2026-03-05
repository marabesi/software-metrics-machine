import pytest
from unittest.mock import patch, MagicMock
from software_metrics_machine.providers.sonarqube.sonarqube_client import (
    SonarqubeMeasuresClient,
)
from tests.in_memory_configuration import InMemoryConfiguration


class TestSonarqubeMeasuresClient:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.configuration = InMemoryConfiguration(".")
        # set sonar-related attrs dynamically
        self.configuration.sonar_url = "http://sonarqube:9000"
        self.configuration.sonar_token = "fake_token"
        self.configuration.sonar_project = "fake_project"
        self.client = SonarqubeMeasuresClient(configuration=self.configuration)

    def test_fetch_measures_store_result(self):
        with (
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists"
            ) as mock_read,
            patch(
                "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.store_file"
            ) as mocked_store,
            patch("requests.get") as mock_get,
        ):    
            mock_read.return_value = None

            mock_response = MagicMock()
            mock_response.json.return_value = {"component": {"key": "fake_project"}}
            mock_response.status_code = 200
            mock_get.return_value = mock_response

            self.client.fetch_measures(metric_keys="bugs,coverage")

            mock_read.assert_called_once_with("measures.json")
            mock_get.assert_called_once()
            mocked_store.assert_called_once()
