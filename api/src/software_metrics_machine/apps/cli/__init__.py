import importlib

import click


@click.group()
def main():
    pass


def add_commands_from_groups(module_groups):
    for group_name, module_paths in module_groups.items():

        @click.group(name=group_name)
        def group():
            pass

        for module_path in module_paths:
            module = importlib.import_module(module_path)
            if hasattr(module, "command"):
                group.add_command(module.command)

        main.add_command(group)


module_groups = {
    "prs": [
        "software_metrics_machine.apps.cli.github_fetch_prs",
        "software_metrics_machine.apps.cli.github_fetch_prs_comments",
        "software_metrics_machine.apps.cli.pull_request_through_time",
        "software_metrics_machine.apps.cli.pull_request_average_of_prs_open_by",
        "software_metrics_machine.apps.cli.pull_request_view_average_review_time_by_author",
        "software_metrics_machine.apps.cli.pull_request_view_prs_by_author",
        "software_metrics_machine.apps.cli.pull_request_view_summary",
        "software_metrics_machine.apps.cli.pull_request_average_of_comments_by_prs",
    ],
    "pipelines": [
        "software_metrics_machine.apps.cli.github_fetch_pipeline",
        "software_metrics_machine.apps.cli.github_fetch_jobs_pipeline",
        "software_metrics_machine.apps.cli.pipeline_summary",
        "software_metrics_machine.apps.cli.pipeline_by_status",
        "software_metrics_machine.apps.cli.pipeline_runs_duration",
        "software_metrics_machine.apps.cli.pipeline_runs_by",
        "software_metrics_machine.apps.cli.pipeline_jobs_summary",
        "software_metrics_machine.apps.cli.pipeline_jobs_time_execution",
        "software_metrics_machine.apps.cli.pipeline_jobs_by_status",
        "software_metrics_machine.apps.cli.pipeline_deployment_frequency",
        "software_metrics_machine.apps.cli.pipeline_lead_time",
    ],
    "code": [
        "software_metrics_machine.apps.cli.pydriller_change_set",
        "software_metrics_machine.apps.cli.codemaat_fetch",
        "software_metrics_machine.apps.cli.source_code_code_churn",
        "software_metrics_machine.apps.cli.source_code_coupling",
        "software_metrics_machine.apps.cli.source_code_entity_churn",
        "software_metrics_machine.apps.cli.source_code_entity_effort",
        "software_metrics_machine.apps.cli.source_code_entity_ownership",
        "software_metrics_machine.apps.cli.source_code_pairing_index",
        "software_metrics_machine.apps.cli.source_code_metadata",
    ],
    "tools": [
        "software_metrics_machine.apps.cli.tools_json_file_merger",
    ],
}

add_commands_from_groups(module_groups)

if __name__ == "__main__":
    main()
