import { describe, expect, it } from 'vitest';
import { PipelineGitHubJobBuilder, PipelineGitHubRunBuilder } from '../../../src';
import { PipelinesRepository } from '../../../src';
import { InMemoryRepository } from '../../../src/test/in-memory-repository';
import {
  WorkflowJobJsonResponse,
  WorkflowJsonResponse,
} from '../../../src/providers/github/github-response-types';

describe('PipelinesRepository loadPipelines', () => {
  const pipelineRunRepository = new InMemoryRepository<WorkflowJsonResponse>();
  const pipelineJobsRepository = new InMemoryRepository<WorkflowJobJsonResponse>();

  const createRepository = () => {
    return new PipelinesRepository(pipelineRunRepository, pipelineJobsRepository);
  };

  it('should load pipelines with corresponding jobs attached', async () => {
    const runs = [
      new PipelineGitHubRunBuilder()
        .id('run-1')
        .number('1')
        .name('CI')
        .status('completed')
        .createdAt('2026-05-10T00:00:00Z')
        .updatedAt('2026-05-10T00:05:00Z')
        .startedAt('2026-05-10T00:00:00Z')
        .branch('main')
        .path('.github/workflows/ci.yml')
        .build(),
      new PipelineGitHubRunBuilder()
        .id('run-2')
        .number('2')
        .name('CD')
        .status('completed')
        .createdAt('2026-05-11T00:00:00Z')
        .updatedAt('2026-05-11T00:05:00Z')
        .startedAt('2026-05-11T00:00:00Z')
        .branch('main')
        .path('.github/workflows/cd.yml')
        .build(),
    ];

    const jobs = [
      new PipelineGitHubJobBuilder()
        .id('job-1')
        .runId('run-1')
        .name('build')
        .startedAt('2026-05-10T00:01:00Z')
        .completedAt('2026-05-10T00:02:00Z')
        .status('completed')
        .conclusion('success')
        .build(),
      new PipelineGitHubJobBuilder()
        .id('job-2')
        .runId('run-1')
        .name('test')
        .startedAt('2026-05-10T00:02:00Z')
        .completedAt('2026-05-10T00:04:00Z')
        .status('completed')
        .conclusion('success')
        .build(),
      new PipelineGitHubJobBuilder()
        .id('job-3')
        .runId('run-missing')
        .name('orphan')
        .startedAt('2026-05-10T00:02:00Z')
        .completedAt('2026-05-10T00:04:00Z')
        .status('completed')
        .conclusion('success')
        .build(),
    ];

    await pipelineRunRepository.saveAll(runs);
    await pipelineJobsRepository.saveAll(jobs);

    const repository = createRepository();

    const loadedRuns = await repository.loadPipelines();

    expect(loadedRuns).toHaveLength(2);
    expect(loadedRuns[0].jobs).toHaveLength(2);
    expect(loadedRuns[0].jobs?.[0].runId).toBe('run-1');
    expect(loadedRuns[1].jobs).toBeUndefined();
  });
});
