from infrastructure.configuration.configuration import Configuration


class InMemoryConfiguration(Configuration):
    def __init__(self):
        super().__init__(
            git_provider="github",
            github_token="fake_token",
            github_repository="fake/repo",
            store_data="in_memory",
            git_repository_location="in_memory",
        )
