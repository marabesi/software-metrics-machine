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
    expected = ["Build Workflow", "Test Workflow", "Deploy Workflow"]
    result = mock_loader.get_unique_workflow_names()
    assert set(result) == set(expected)  # Ensure the sets have the same elements
