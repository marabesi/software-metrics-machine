import os
import sys

class Configuration:
  def __init__(self):
      self.git_provider = "github"
      self.github_token = os.getenv("GITHUB_TOKEN")
      self.github_repository = os.getenv("REPO")
      self.store_data = os.getenv("STORE_DATA_AT", "data")

      print(f"Configuration: git_provider={self.git_provider} repository={self.github_repository} store_data={self.store_data}")

      if self.git_provider.lower() == "github":
        if not self.github_token:
            print("❌  You must export GITHUB_TOKEN before running.")
            sys.exit(1)

        # format: owner/repo
        if not self.github_repository:
            print("❌  Set REPO=owner/repo (e.g. octocat/Hello-World)")
            sys.exit(1)

        self.HEADERS = {
            "Authorization": f"token {self.github_token}",
            "Accept": "application/vnd.github+json",
        }