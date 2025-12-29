from unittest.mock import patch

import pytest
from software_metrics_machine.core.pipelines.aggregates.pipeline_execution_duration import (
    PipelineExecutionDuration,
)
from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)
from tests.builders import as_json_string
from tests.in_memory_configuration import InMemoryConfiguration


class TestPipelineRunDuration:

    @pytest.mark.parametrize(
        "key, expected_value",
        [
            ("names", []),
            ("values", []),
            ("job_counts", []),
            ("rows", []),
        ],
    )
    def test_empty_runs(self, key, expected_value):
        def mocked_read_file_if_exists(file):
            if file == "workflows.json":
                return as_json_string([])
            if file == "jobs.json":
                return as_json_string([])
            return None

        with patch(
            "software_metrics_machine.core.infrastructure.file_system_base_repository.FileSystemBaseRepository.read_file_if_exists",
            side_effect=mocked_read_file_if_exists,
        ):
            repository = PipelinesRepository(configuration=InMemoryConfiguration("."))

            pipeline_duration = PipelineExecutionDuration(repository=repository)
            result = pipeline_duration.main()

            assert result.__getattribute__(key) == expected_value
