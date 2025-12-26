from datetime import datetime, timezone
from software_metrics_machine.core.infrastructure.pandas import pd
import requests
from software_metrics_machine.core.infrastructure.configuration.configuration import (
    Configuration,
)
from software_metrics_machine.core.infrastructure.logger import Logger
from software_metrics_machine.core.prs.pr_types import PRFilters
from software_metrics_machine.core.prs.prs_repository import PrsRepository
from software_metrics_machine.core.infrastructure.json import as_json_string


class GithubPrsClient:

    def __init__(self, configuration: Configuration):
        self.HEADERS = {
            "Authorization": f"token {configuration.github_token}",
            "Accept": "application/vnd.github+json",
        }
        self.repository_slug = configuration.github_repository
        self.pr_repository = PrsRepository(configuration=configuration)
        self.logger = Logger(configuration=configuration).get_logger()
        self.configuration = configuration

    def fetch_prs(
        self, start_date=None, end_date=None, months=1, force=None, raw_filters=None
    ):
        pr_json_path = "prs.json"

        if force:
            print("Force re-fetching PRs even if already fetched")
            self.pr_repository.remove_file(pr_json_path)

        contents = self.pr_repository.read_file_if_exists(pr_json_path)
        if contents is not None:
            print(f"PRs file already exists. Loading PRs from {pr_json_path}")
            return

        params = self.pr_repository.parse_raw_filters(raw_filters)

        if not start_date or not end_date:
            print(
                f"No start_date or end_date provided. Defaulting to the last {months} month(s)."
            )
            end_date = datetime.now(timezone.utc)
            start_date = end_date - pd.DateOffset(months=months)
            start_date = start_date.to_pydatetime()
            start_date = str(start_date)
            end_date = str(end_date)

        if start_date and end_date:
            try:
                start_date = datetime.fromisoformat(start_date).replace(
                    tzinfo=timezone.utc
                )
                end_date = datetime.fromisoformat(end_date).replace(tzinfo=timezone.utc)
            except ValueError:
                raise ValueError("Dates must be in ISO format: YYYY-MM-DD")

        self.logger.info(
            f"Fetching PRs for {self.repository_slug} from {start_date.date()} to {end_date.date()}"  # noqa
        )

        prs = []
        state = "all"
        per_page = 100
        sort = "created"
        direction = "desc"

        if "state" in params:
            state = params["state"]
        if "per_page" in params:
            per_page = int(params["per_page"])
        if "sort" in params:
            sort = params["sort"]
        if "direction" in params:
            direction = params["direction"]

        url = f"https://api.github.com/repos/{self.repository_slug}/pulls"  # noqa

        stop = False
        while url and not stop:
            print(f"  → fetching {url}")
            r = requests.get(
                url,
                headers=self.HEADERS,
                params={
                    "state": state,
                    "per_page": per_page,
                    "sort": sort,
                    "direction": direction,
                    **{
                        k: v
                        for k, v in params.items()
                        if k not in ["state", "per_page", "sort", "direction"]
                    },
                },
            )
            r.raise_for_status()
            page_prs = r.json()

            for pr in page_prs:
                created = datetime.fromisoformat(
                    pr["created_at"].replace("Z", "+00:00")
                )
                if created < start_date:
                    stop = True
                    break
                if created <= end_date:
                    prs.append(pr)

            link = r.links.get("next")
            print(f"  → link: {link}")
            url = link["url"] if link and not stop else None

        self.pr_repository.store_file(pr_json_path, as_json_string(prs))

    def fetch_pr_comments(
        self,
        filters: PRFilters | None = None,
        raw_params: str | None = None,
        force: bool = False,
    ):
        prs = self.pr_repository.prs_with_filters(filters=filters)

        review_comments_path = "prs_review_comments.json"

        if not force:
            if self.pr_repository.read_file_if_exists(review_comments_path) is not None:
                print(
                    f"Comments file already exists at {review_comments_path}. Use --force to re-fetch"
                )
                return

        comments = []
        for pr in prs:
            review_comments_url = pr.review_comments_url
            if review_comments_url:
                print(f"Fetching review comments from {review_comments_url}")
                params = {
                    "per_page": "100",
                }
                if raw_params:
                    params = {
                        **params,
                        **self.pr_repository.parse_raw_filters(raw_params),
                    }
                r = requests.get(
                    review_comments_url, headers=self.HEADERS, params=params
                )

                r.raise_for_status()
                result = r.json()

                for comment in result:
                    comments.append(comment)
            else:
                print("No review_comments_url found on PR")

            print(f"Wrote {len(comments)} review comments to {review_comments_path}")

        self.pr_repository.store_file(review_comments_path, as_json_string(comments))
