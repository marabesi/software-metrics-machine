import requests
from software_metrics_machine.core.infrastructure.configuration.configuration import (
    Configuration,
)
from software_metrics_machine.core.infrastructure.logger import Logger
from software_metrics_machine.core.infrastructure.json import as_json_string
from software_metrics_machine.providers.sonarqube.sonarqube_repository import (
    SonarqubeRepository,
)


class SonarqubeMeasuresClient:
    """Client for fetching measures from SonarQube."""

    def __init__(self, configuration: Configuration):
        self.sonar_url = getattr(configuration, "sonar_url", None)
        self.sonar_token = getattr(configuration, "sonar_token", None)
        self.sonar_project = getattr(configuration, "sonar_project", None)
        self.repository = SonarqubeRepository(configuration=configuration)
        self.logger = Logger(configuration=configuration).get_logger()

        self.HEADERS = {
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

        if self.sonar_token:
            self.HEADERS["Authorization"] = f"Bearer {self.sonar_token}"

    def fetch_measures(self, project_key: str | None = None, metric_keys: str | None = None, force: bool = False):
        """Fetch component measures from SonarQube and store them locally.

        Args:
            project_key: SonarQube project key. If None, uses configuration's sonar_project.
            metric_keys: comma separated metric keys (e.g. "bugs,coverage").
            force: force re-fetch even if file exists.
        """
        measures_path = "measures.json"

        if force:
            self.repository.remove_file(measures_path)

        contents = self.repository.read_file_if_exists(measures_path)
        if contents is not None:
            self.logger.info(f"Measures file already exists. Loading from {measures_path}")
            return

        if not project_key:
            project_key = self.sonar_project

        # Build params; component is optional to allow tests to mock requests
        params = {}
        if project_key:
            params["component"] = project_key
        if metric_keys:
            params["metricKeys"] = metric_keys

        # Build URL safely — if sonar_url not configured, use the API path only
        if self.sonar_url:
            url = f"{self.sonar_url.rstrip('/')}/api/measures/component"
        else:
            url = "/api/measures/component"

        try:
            self.logger.info(f"Fetching SonarQube measures for {project_key}")
            response = requests.get(url, headers=self.HEADERS, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()

            self.repository.store_file(measures_path, as_json_string(data))

        except requests.exceptions.RequestException as e:
            self.logger.error(f"Error fetching SonarQube measures: {str(e)}")
            raise
