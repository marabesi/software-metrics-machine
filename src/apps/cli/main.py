import importlib

import click


@click.group()
def main():
    click.echo("Welcome to Software Metrics Machine CLI")


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
        "src.apps.cli.github_fetch_prs",
        "src.apps.cli.pull_request_average_of_prs_open_by",
        "src.apps.cli.pull_request_view_average_review_time_by_author",
        "src.apps.cli.pull_request_view_prs_by_author",
        "src.apps.cli.pull_request_view_summary",
    ],
    "pipelines": [
        "src.apps.cli.github_fetch_pipeline",
        "src.apps.cli.github_fetch_jobs_pipeline",
        "src.apps.cli.pipeline_summary",
        "src.apps.cli.pipeline_by_status",
        "src.apps.cli.pipeline_runs_duration",
        "src.apps.cli.pipeline_runs_by",
        "src.apps.cli.pipeline_jobs_summary",
        "src.apps.cli.pipeline_jobs_average_time_execution",
        "src.apps.cli.pipeline_jobs_by_status",
        "src.apps.cli.pipeline_deployment_frequency",
    ],
    "code": [
        "src.apps.cli.pydriller_change_set",
        "src.apps.cli.codemaat_fetch",
        "src.apps.cli.source_code_code_churn",
        "src.apps.cli.source_code_coupling",
        "src.apps.cli.source_code_entity_churn",
        "src.apps.cli.source_code_entity_effort",
        "src.apps.cli.source_code_entity_ownership",
        "src.apps.cli.source_code_pairing_index",
    ],
    "tools": [
        "src.apps.cli.tools_json_file_merger",
    ],
}

add_commands_from_groups(module_groups)

if __name__ == "__main__":
    main()
