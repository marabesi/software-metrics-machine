import click

from software_metrics_machine.core.infrastructure.configuration.configuration_builder import (
    ConfigurationBuilder,
    Driver,
)
from datetime import datetime
from pydriller.metrics.process.change_set import ChangeSet


@click.command()
def change_set():
    configuration = ConfigurationBuilder(Driver.JSON).build()

    since_str = configuration.dashboard_start_date
    to_str = configuration.dashboard_end_date

    since = datetime.strptime(since_str, "%Y-%m-%d")
    to = datetime.strptime(to_str, "%Y-%m-%d")

    metric = ChangeSet(
        path_to_repo=configuration.git_repository_location, since=since, to=to
    )

    maximum = metric.max()
    average = metric.avg()

    print("Maximum number of files committed together: {}".format(maximum))
    print("Average number of files committed together: {}".format(average))


command = change_set
