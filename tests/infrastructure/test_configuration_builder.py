import os

import pytest

from core.infrastructure.configuration.configuration_builder import (
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
