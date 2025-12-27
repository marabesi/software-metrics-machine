import logging
import sys

from software_metrics_machine.core.infrastructure.configuration.configuration import (
    Configuration,
)


class Logger:
    def __init__(self, configuration: Configuration, name: str = __name__):
        self.configuration = configuration
        log_level = logging.INFO
        if self.configuration.logging_level:
            if self.configuration.logging_level == "INFO":
                log_level = logging.INFO
            if self.configuration.logging_level == "DEBUG":
                log_level = logging.DEBUG
        logging.basicConfig(level=log_level, stream=sys.stdout)
        self.logger = logging.getLogger(name)
        self.logger.setLevel(log_level)

    def get_logger(self):
        return self.logger
