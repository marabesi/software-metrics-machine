import logging


class Logger:
    def __init__(self, name: str = __name__):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.DEBUG)

    def get_logger(self):
        return self.logger


# Example usage
# logger_instance = Logger(__name__).get_logger()
