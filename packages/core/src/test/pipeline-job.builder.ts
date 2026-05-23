import type { PipelineJob as PipelineJobType } from '../domain/pipelines/pipeline-types';

/**
 * Chainable builder for pipeline jobs in tests.
 */
export class PipelineJobBuilder {
  private data: PipelineJobType = {
    id: 'job-1',
    runId: 'run-1',
    name: 'build',
    startedAt: new Date().toISOString(),
    conclusion: 'success',
    status: 'completed',
  };

  id(value: string): PipelineJobBuilder {
    this.data.id = value;
    return this;
  }

  runId(value: string): PipelineJobBuilder {
    this.data.runId = value;
    return this;
  }

  name(value: string): PipelineJobBuilder {
    this.data.name = value;
    return this;
  }

  startedAt(value: string): PipelineJobBuilder {
    this.data.startedAt = value;
    return this;
  }

  completedAt(value?: string): PipelineJobBuilder {
    this.data.completedAt = value;
    return this;
  }

  conclusion(value: string): PipelineJobBuilder {
    this.data.conclusion = value;
    return this;
  }

  status(value: string): PipelineJobBuilder {
    this.data.status = value;
    return this;
  }

  durationSeconds(value?: number): PipelineJobBuilder {
    this.data.durationSeconds = value;
    return this;
  }

  build(): PipelineJobType {
    return { ...this.data };
  }
}
