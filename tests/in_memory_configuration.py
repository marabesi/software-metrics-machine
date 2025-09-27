from infrastructure.configuration.configuration import Configuration


class InMemoryConfiguration(Configuration):
    def __init__(self, store_data: str):
        super().__init__(
            git_provider="github",
            github_token="fake_token",
            github_repository="fake/repo",
            store_data=store_data,
            git_repository_location="in_memory",
        )
