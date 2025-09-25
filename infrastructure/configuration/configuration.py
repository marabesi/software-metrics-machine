import os
import sys


class Configuration:
    def __init__(
        self,
        git_provider="github",
        github_token=None,
        github_repository=None,
        store_data=None,
        git_repository_location=None,
    ):
        self.git_provider = git_provider
        self.github_token = github_token or os.getenv("SSM_GITHUB_TOKEN")
        self.github_repository = github_repository or os.getenv("SSM_GITHUB_REPOSITORY")
        self.store_data = store_data or os.getenv("SSM_STORE_DATA_AT")
        self.git_repository_location = git_repository_location or os.getenv(
            "SSM_GIT_REPOSITORY_LOCATION"
        )

        print(
            f"Configuration: {self.git_provider} repository={self.github_repository} store_data={self.store_data}"
        )

        if not self.git_repository_location:
            print("❌  You must export SSM_GIT_REPOSITORY_LOCATION before running.")
            sys.exit(1)

        if not self.store_data:
            print("❌  You must export SSM_STORE_DATA_AT before running.")
            sys.exit(1)

        if self.git_provider.lower() == "github":
            if not self.github_token:
                print("❌  You must export SSM_GITHUB_TOKEN before running.")
                sys.exit(1)
            # format: owner/repo
            if not self.github_repository:
                print(
                    "❌  Set SSM_GITHUB_REPOSITORY=owner/repo (e.g. octocat/Hello-World)"
                )
                sys.exit(1)

            self.HEADERS = {
                "Authorization": f"token {self.github_token}",
                "Accept": "application/vnd.github+json",
            }
