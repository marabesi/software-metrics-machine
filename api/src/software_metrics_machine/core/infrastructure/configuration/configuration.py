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
        main_branch=None,
        dashboard_start_date=None,
        dashboard_end_date=None,
        dashboard_color=None,
        logging_level=None,
    ):
        self.git_provider = git_provider
        self.github_token = github_token
        self.github_repository = github_repository
        self.store_data = store_data
        self.git_repository_location = git_repository_location
        self.deployment_frequency_target_pipeline = deployment_frequency_target_pipeline
        self.deployment_frequency_target_job = deployment_frequency_target_job
        self.main_branch = main_branch
        self.dashboard_start_date = dashboard_start_date
        self.dashboard_end_date = dashboard_end_date
        self.dashboard_color = dashboard_color
        self.logging_level = logging_level

        if not self.git_repository_location:
            raise ValueError(
                "❌  You must provide git_repository_location before running."
            )
        if self.git_provider.lower() == "github":
            # format: owner/repo
            if not self.github_repository:
                raise ValueError(
                    "❌ You must provide github_repository (e.g. octocat/Hello-World)"
                )
        if not self.dashboard_color:
            self.dashboard_color = "#6b77e3"

        if not self.logging_level:
            self.logging_level = "CRITICAL"
