import time
from pathlib import Path


from software_metrics_machine.core.pipelines.pipelines_repository import (
    PipelinesRepository,
)
from tests.pipeline_builder import PipelineBuilder, PipelineJobBuilder
from tests.builders import as_json_string
from tests.in_memory_configuration import InMemoryConfiguration


class TestPipelineJobsAssociationScalingFitnessFunction:
    def _write_store_files(self, config, runs, jobs):
        repo_part = config.github_repository.replace("/", "_")
        target_dir = f"{config.git_provider}_{repo_part}"
        data_dir = Path(config.store_data) / target_dir / "github"
        data_dir.mkdir(parents=True, exist_ok=True)
        (data_dir / "workflows.json").write_text(as_json_string(runs))
        (data_dir / "jobs.json").write_text(as_json_string(jobs))

    def _time_association(self, num_runs: int, jobs_per_run: int, tmp_path) -> float:
        config = InMemoryConfiguration(str(tmp_path))

        runs = [
            PipelineBuilder().with_id(i + 1).with_path(f"/workflows/w_{i}.yml").build()
            for i in range(num_runs)
        ]

        jobs = []
        jid = 1
        for r in runs:
            for j in range(jobs_per_run):
                jobs.append(
                    PipelineJobBuilder()
                    .with_id(jid)
                    .with_run_id(r.id)
                    .with_name(f"job-{j}")
                    .build()
                )
                jid += 1

        self._write_store_files(config, runs, jobs)

        t0 = time.perf_counter()
        PipelinesRepository(configuration=config)
        t1 = time.perf_counter()
        return t1 - t0

    def test_jobs_association_scales_near_linearly(self, tmp_path):
        """Fitness function: ensure run->job association scales near-linearly.

        The test measures instantiation (which performs the association) for two
        dataset sizes and asserts the elapsed time grows approximately linearly
        with the number of jobs. This detects accidental quadratic regressions.
        """

        # Small and large sizes (tune these for CI machines if needed)
        small_runs, small_per = 200, 5  # ~1000 jobs
        large_runs, large_per = 2000, 5  # ~10000 jobs

        small_jobs = small_runs * small_per
        large_jobs = large_runs * large_per

        small_elapsed = self._time_association(small_runs, small_per, tmp_path)
        large_elapsed = self._time_association(large_runs, large_per, tmp_path)

        ratio_counts = large_jobs / small_jobs
        measured_ratio = large_elapsed / max(small_elapsed, 1e-6)

        # Allow some slack for CI variability — require that time grows no more than
        # 3x the ideal linear factor. If a quadratic regression appears, this will fail.
        allowed_multiplier = 3.0

        assert measured_ratio <= ratio_counts * allowed_multiplier, (
            f"Jobs association scaling regression: small={small_jobs} took {small_elapsed:.3f}s, "
            f"large={large_jobs} took {large_elapsed:.3f}s, measured_ratio={measured_ratio:.2f}, "
            f"allowed={ratio_counts * allowed_multiplier:.2f}"
        )
