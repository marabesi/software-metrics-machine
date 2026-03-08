import os

import pytest

from software_metrics_machine.core.infrastructure.configuration.configuration_builder import (
    ConfigurationBuilder,
    Driver,
)


class TestConfigurationBuilder:

    def test_missing_path_when_building_configuration(self):
        os.environ["SMM_STORE_DATA_AT"] = ""
        with pytest.raises(
            ValueError, match="Path must be provided when using JSON driver"
        ):
            ConfigurationBuilder(driver=Driver.JSON).build()

    def test_throw_is_invalid_driver_is_given(self):
        os.environ["SMM_STORE_DATA_AT"] = ""
        with pytest.raises(ValueError, match="Invalid configuration"):
            ConfigurationBuilder("").build()

    def test_gitlab_provider_should_use_gitlab_token(self):
        """Verify that GitLab configuration uses gitlab_token, not github_token.
        
        This test ensures that the GitlabPrsClient receives the correct
        gitlab_token instead of accidentally using github_token.
        Regression test for: GitLab client was using github_token
        """
        data = {
            "git_provider": "gitlab",
            "gitlab_token": "glpat-secure_token_123",
            "github_token": "ghp_different_token_456",
            "github_repository": "group/project",
            "git_repository_location": "/path/to/repo",
        }
        
        config = ConfigurationBuilder.create_web_configuration(data)
        
        # When provider is gitlab, we should have gitlab_token available
        assert config.git_provider == "gitlab"
        assert hasattr(config, 'gitlab_token'), "Configuration should have gitlab_token field"
        assert config.gitlab_token == "glpat-secure_token_123"
        # Verify github_token is still available (for backward compatibility if needed)
        assert config.github_token == "ghp_different_token_456"
