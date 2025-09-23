import pytest
from infrastructure.configuration import Configuration
from providers.github.workflows.repository_workflows import LoadWorkflows


@pytest.fixture
def mock_os_env(monkeypatch):
    """Fixture to mock os.getenv to always return 'faked'."""
    monkeypatch.setattr("os.getenv", lambda key, default=None: "faked")


@pytest.fixture
def mock_loader(mock_os_env):
    """Fixture to set up a mock instance of LoadWorkflows with sample data."""
    loader = LoadWorkflows(configuration=Configuration())
    loader.all_runs = [
        {"name": "Build Workflow", "id": 1},
        {"name": "Test Workflow", "id": 2},
        {"name": "Deploy Workflow", "id": 3},
        {"name": "Build Workflow", "id": 4},  # Duplicate name
    ]
    return loader


def test_get_unique_workflow_names(mock_loader):
    """Test that get_unique_workflow_names returns unique workflow names."""
    result = mock_loader.get_unique_workflow_names()
    assert len(result) == 3  # Ensure the sets have the same elements


def test_get_unique_workflow_paths(mock_loader):
    """Test that get_unique_workflow_paths returns unique workflow paths."""
    mock_loader.all_runs = [
        {"path": "/workflows/build.yml", "id": 1},
        {"path": "/workflows/test.yml", "id": 2},
        {"path": "/workflows/deploy.yml", "id": 3},
        {"path": "/workflows/build.yml", "id": 4},  # Duplicate path
    ]

    result = mock_loader.get_unique_workflow_paths()
    assert len(result) == 3  # Ensure the sets have the same elements
