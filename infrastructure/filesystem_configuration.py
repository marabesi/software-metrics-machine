from infrastructure.configuration import Configuration


class FilesystemConfiguration:
    """
    A builder class to create Configuration objects.
    """

    def build(self) -> Configuration:
        """
        Build and return a Configuration object.

        :return: A Configuration instance.
        """
        return Configuration()
