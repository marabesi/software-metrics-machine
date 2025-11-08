from software_metrics_machine.core.pipelines.aggregates.jobs_summary import JobsSummary
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)
from software_metrics_machine.core.infrastructure.date_and_time import datetime_to_local


class ViewJobsSummary:
    def __init__(self, repository: PipelinesRepository):
        self.repository = repository

    def print_summary(
        self,
        max_jobs: int = 10,
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> None:
        self.jobs = self.repository.jobs(
            {"start_date": start_date, "end_date": end_date}
        )

        self.jobs_summary = JobsSummary(repository=self.repository)
        summary = self.jobs_summary.summarize_jobs(self.jobs)

        if summary.get("total_jobs", 0) == 0:
            print("No job executions available.")
            return

        print("")
        print("Jobs summary:")
        print(f"  Total job executions: {summary['total_jobs']}")

        # conclusions breakdown
        concls = summary.get("conclusions", {})
        if concls:
            print("")
            print("Conclusions:")
            for k, v in sorted(concls.items(), key=lambda x: x[1], reverse=True):
                print(f"  {k:10s}: {v}")

        print(f"  Unique job names: {summary.get('unique_jobs', 0)}")

        jobs_by_name = summary.get("jobs_by_name", {})
        if jobs_by_name:
            print("")
            print("Executions by job name:")
            sorted_items = sorted(
                jobs_by_name.items(), key=lambda x: x[1].get("count", 0), reverse=True
            )
            for name, info in sorted_items[:max_jobs]:
                cnt = info.get("count", 0)
                print(f"  {cnt:4d}  {name} ")

        # print first/last with formatted dates
        first = summary["first_job"]
        last = summary["last_job"]

        self.__print_job(first, last)

    def __print_job(self, first, last) -> None:
        print("")
        print("First job:")
        created_at = first.get("created_at")
        started_at = first.get("started_at")
        ended_at = first.get("completed_at") or first.get("updated_at")
        print(f"  Created at: {datetime_to_local(created_at)}")
        print(f"  Started at: {datetime_to_local(started_at)}")
        print(f"  Completed/Updated at: {datetime_to_local(ended_at)}")

        print("")
        print("Last job:")
        created_at = last.get("created_at")
        started_at = last.get("started_at")
        ended_at = last.get("completed_at") or last.get("updated_at")
        print(f"  Created at: {datetime_to_local(created_at)}")
        print(f"  Started at: {datetime_to_local(started_at)}")
        print(f"  Completed/Updated at: {datetime_to_local(ended_at)}")
