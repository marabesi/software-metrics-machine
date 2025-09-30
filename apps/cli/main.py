import click
import importlib


@click.group()
def main():
    click.echo("Welcome to the Unified CLI for generating charts and summaries.")


def add_commands_from_groups(module_groups):
    """
    Dynamically load commands grouped by categories.

    Args:
        module_groups (dict): A dictionary where keys are group names and values are lists of module paths.
    """
    for group_name, module_paths in module_groups.items():

        @click.group(name=group_name)
        def group():
            """Group for {} commands.""".format(group_name)
            pass

        for module_path in module_paths:
            module = importlib.import_module(module_path)
            if hasattr(module, "command"):
                # print(f"Loading command from {module_path} into group {group_name}...")
                group.add_command(module.command)

        main.add_command(group)


module_groups = {
    "prs": [
        "providers.github.prs.cli.fetch_prs",
        "providers.github.prs.cli.average_of_prs_open_by",
        "providers.github.prs.cli.view_average_review_time_by_author",
        "providers.github.prs.cli.view_prs_by_author",
        "providers.github.prs.cli.view_summary",
    ],
    "pipelines": [
        "providers.github.workflows.cli.fetch_workflows",
        "providers.github.workflows.cli.fetch_jobs",
        "providers.github.workflows.cli.workflow_summary",
        "providers.github.workflows.cli.workflow_by_status",
        "providers.github.workflows.cli.workflow_runs_duration",
        "providers.github.workflows.cli.workflow_runs_by",
        "providers.github.workflows.cli.jobs_summary",
        "providers.github.workflows.cli.jobs_average_time_execution",
        "providers.github.workflows.cli.jobs_by_status",
        "providers.github.workflows.cli.workflow_deployment_frequency",
    ],
    "codemaat": [
        "providers.codemaat.cli.code_churn",
        "providers.codemaat.cli.coupling",
        "providers.codemaat.cli.entity_churn",
        "providers.codemaat.cli.entity_effort",
        "providers.codemaat.cli.entity_ownership",
    ],
}

add_commands_from_groups(module_groups)

if __name__ == "__main__":
    main()
