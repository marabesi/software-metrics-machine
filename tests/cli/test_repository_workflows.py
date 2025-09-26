from unittest.mock import patch

from providers.github.workflows.repository_workflows import LoadWorkflows
from tests.builders import as_json_string
from tests.in_memory_configuration import InMemoryConfiguration


class TestRepositoryWorkflows:
    def test_get_unique_workflow_names(self):
        workflows_with_duplicates = as_json_string(
            [
                {"name": "Build Workflow", "id": 1},
                {"name": "Test Workflow", "id": 2},
                {"name": "Deploy Workflow", "id": 3},
                {"name": "Build Workflow", "id": 4},  # Duplicate name
            ]
        )
        with (
            patch(
                "infrastructure.base_repository.BaseRepository.read_file_if_exists",
                return_value=workflows_with_duplicates,
            ),
        ):
            loader = LoadWorkflows(configuration=InMemoryConfiguration())
            result = loader.get_unique_workflow_names()
            assert len(result) == 3

    def test_get_unique_workflow_paths(self):
        workflows_with_duplicated_paths = as_json_string(
            [
                {"path": "/workflows/build.yml", "id": 1},
                {"path": "/workflows/test.yml", "id": 2},
                {"path": "/workflows/deploy.yml", "id": 3},
                {"path": "/workflows/build.yml", "id": 4},
                {"path": "/workflows/build.yml", "id": 5},
            ]
        )
        with (
            patch(
                "infrastructure.base_repository.BaseRepository.read_file_if_exists",
                return_value=workflows_with_duplicated_paths,
            ),
        ):
            loader = LoadWorkflows(configuration=InMemoryConfiguration())

            result = loader.get_unique_workflow_paths()
            assert len(result) == 4

    def test_adds_all_option_by_default(self):
        empty_workflow_runs = as_json_string([])
        with (
            patch(
                "infrastructure.base_repository.BaseRepository.read_file_if_exists",
                return_value=empty_workflow_runs,
            ),
        ):
            loader = LoadWorkflows(configuration=InMemoryConfiguration())

            result = loader.get_unique_workflow_paths()
            assert result[0] == "All"

    def test_deployment_frequency(self):
        empty_workflow_runs = as_json_string(
            [
                {
                    "id": 1,
                    "path": "/workflows/build.yml",
                    "status": "success",
                    "created_at": "2023-10-01T12:00:00Z",
                    "jobs": [
                        {
                            "name": "Deploy",
                            "conclusion": "success",
                            "created_at": "2023-10-01T12:05:00Z",
                        }
                    ],
                },
            ]
        )
        with (
            patch(
                "infrastructure.base_repository.BaseRepository.read_file_if_exists",
                return_value=empty_workflow_runs,
            ),
        ):
            loader = LoadWorkflows(configuration=InMemoryConfiguration())

            result = loader.get_deployment_frequency_for_job("Deploy")
            assert "2023-10" in result["months"]
            assert "2023-W39" in result["weeks"]
