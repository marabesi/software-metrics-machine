import pytest
from infrastructure.configuration.configuration_builder import (
    ConfigurationBuilder,
    Driver,
)
from providers.github.workflows.repository_workflows import LoadWorkflows


@pytest.fixture
def mock_os_env(monkeypatch):
    """Fixture to mock os.getenv to always return 'faked'."""
    monkeypatch.setattr("os.getenv", lambda key, default=None: "faked")


@pytest.fixture
def mock_loader(mock_os_env):
    """Fixture to set up a mock instance of LoadWorkflows with sample data."""
    loader = LoadWorkflows(
        configuration=ConfigurationBuilder(driver=Driver.CLI).build()
    )
    loader.all_runs = [
        {"name": "Build Workflow", "id": 1},
        {"name": "Test Workflow", "id": 2},
        {"name": "Deploy Workflow", "id": 3},
        {"name": "Build Workflow", "id": 4},  # Duplicate name
    ]
    return loader


def test_get_unique_workflow_names(mock_loader):
    result = mock_loader.get_unique_workflow_names()
    assert len(result) == 3


def test_get_unique_workflow_paths(mock_loader):
    mock_loader.all_runs = [
        {"path": "/workflows/build.yml", "id": 1},
        {"path": "/workflows/test.yml", "id": 2},
        {"path": "/workflows/deploy.yml", "id": 3},
        {"path": "/workflows/build.yml", "id": 4},
        {"path": "/workflows/build.yml", "id": 4},
    ]

    result = mock_loader.get_unique_workflow_paths()
    assert len(result) == 4


def test_adds_all_option_by_default(mock_loader):
    mock_loader.all_runs = []

    result = mock_loader.get_unique_workflow_paths()
    assert result[0] == "All"
