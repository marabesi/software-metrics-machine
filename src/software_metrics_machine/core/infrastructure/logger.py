import logging

from software_metrics_machine.core.infrastructure.configuration.configuration import (
    Configuration,
)


class Logger:
    def __init__(self, configuration: Configuration, name: str = __name__):
        self.configuration = configuration
        log_level = logging.CRITICAL
        if self.configuration.logging_level:
            if self.configuration.logging_level == "INFO":
                log_level = logging.INFO
            if self.configuration.logging_level == "DEBUG":
                log_level = logging.DEBUG
        logging.basicConfig(level=log_level)
        self.logger = logging.getLogger(name)
        self.logger.setLevel(log_level)
        self.logger.info(
            f"git_repository_location {self.configuration.git_repository_location} repository={self.configuration.github_repository} "
        )

        self.logger.info(
            f"Configuration: {self.configuration.git_provider} store_data={self.configuration.store_data}"
        )

    def get_logger(self):
        return self.logger
