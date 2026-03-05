
# SonarQube Provider

This provider fetches SonarQube component measures and stores them under the configured `store_data` folder.

Quick setup

- Ensure SonarQube is reachable (the project ships a `sonarqube` service in the repository `docker-compose.yml`).
- Provide the following configuration values on your `Configuration` instance before using the client:
	- `sonar_url` — base URL for SonarQube (e.g. `http://localhost:9000`)
	- `sonar_token` — (optional) token for authentication. If provided it will be sent as a `Bearer` header.
	- `sonar_project` — the SonarQube project key to fetch measures for.

Example usage

```python
from software_metrics_machine.core.infrastructure.configuration.configuration import Configuration
from software_metrics_machine.providers.sonarqube.sonarqube_client import SonarqubeMeasuresClient

cfg = Configuration(
		git_provider="github",
		github_token="...",
		github_repository="owner/repo",
		store_data="./data",
		git_repository_location="./repo",
)

# attach SonarQube settings
cfg.sonar_url = "http://sonarqube:9000"
cfg.sonar_token = "YOUR_SONAR_TOKEN"
cfg.sonar_project = "your_project_key"

client = SonarqubeMeasuresClient(configuration=cfg)
client.fetch_measures(metric_keys="bugs,coverage,code_smells")
```

Notes

- The client stores the raw JSON response to `measures.json` under the repository-specific data folder.
- If you run the local SonarQube via Docker Compose, ensure the service is up and healthy before fetching.
- The provider is intentionally minimal: you can extend `SonarqubeMeasuresClient` to fetch more endpoints (e.g. rules, issues, quality gates) if needed.
