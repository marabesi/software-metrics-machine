class Configuration:
    def __init__(
        self,
        git_provider="github",
        github_token=None,
        github_repository=None,
        store_data=None,
        git_repository_location=None,
        deployment_frequency_target_pipeline=None,
        deployment_frequency_target_job=None,
    ):
        self.git_provider = git_provider
        self.github_token = github_token
        self.github_repository = github_repository
        self.store_data = store_data
        self.git_repository_location = git_repository_location
        self.deployment_frequency_target_pipeline = deployment_frequency_target_pipeline
        self.deployment_frequency_target_job = deployment_frequency_target_job

        print("git_repository_location", self.git_repository_location)
        print(
            f"Configuration: {self.git_provider} repository={self.github_repository} store_data={self.store_data}"
        )

        if not self.git_repository_location:
            raise ValueError(
                "❌  You must provide git_repository_location before running."
            )

        if not self.store_data:
            raise ValueError("❌  You must provide store_data before running.")

        if self.git_provider.lower() == "github":
            if not self.github_token:
                raise ValueError("❌  You must provide git_provider before running.")
            # format: owner/repo
            if not self.github_repository:
                raise ValueError(
                    "❌ You must provide github_repository (e.g. octocat/Hello-World)"
                )
