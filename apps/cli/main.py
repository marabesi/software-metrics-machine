import importlib

import click


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
        "apps.cli.github_fetch_prs",
        "apps.cli.pull_request_average_of_prs_open_by",
        "apps.cli.pull_request_view_average_review_time_by_author",
        "apps.cli.pull_request_view_prs_by_author",
        "apps.cli.pull_request_view_summary",
    ],
    "pipelines": [
        "providers.github.workflows.cli.fetch_workflows",
        "providers.github.workflows.cli.fetch_jobs",
        "apps.cli.pipeline_summary",
        "apps.cli.pipeline_by_status",
        "apps.cli.pipeline_runs_duration",
        "apps.cli.pipeline_runs_by",
        "apps.cli.pipeline_jobs_summary",
        "apps.cli.pipeline_jobs_average_time_execution",
        "apps.cli.pipeline_jobs_by_status",
        "apps.cli.pipeline_deployment_frequency",
    ],
    "code": [
        "providers.codemaat.cli.fetch_codemaat",
        "apps.cli.source_code_code_churn",
        "apps.cli.source_code_coupling",
        "apps.cli.source_code_entity_churn",
        "apps.cli.source_code_entity_effort",
        "apps.cli.source_code_entity_ownership",
        "apps.cli.source_code_pairing_index",
    ],
    "pydriller": [
        "providers.pydriller.cli.change_set",
    ],
    "tools": [
        "providers.tools.cli.json_file_merger",
    ],
}

add_commands_from_groups(module_groups)

if __name__ == "__main__":
    main()
