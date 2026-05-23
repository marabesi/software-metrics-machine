import type { PipelineJob, PipelineRun } from '../domain/pipelines/pipeline-types';

/**
 * Chainable builder for pipeline runs in tests.
 */
export class PipelinesRunBuilder {
  private data: PipelineRun = {
    id: 'run-1',
    number: 1,
    name: 'CI',
    status: 'completed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    branch: 'main',
    path: '.github/workflows/ci.yml',
  };

  id(value: string): PipelinesRunBuilder {
    this.data.id = value;
    return this;
  }

  number(value: number): PipelinesRunBuilder {
    this.data.number = value;
    return this;
  }

  name(value: string): PipelinesRunBuilder {
    this.data.name = value;
    return this;
  }

  status(value: string): PipelinesRunBuilder {
    this.data.status = value;
    return this;
  }

  conclusion(value?: string): PipelinesRunBuilder {
    this.data.conclusion = value;
    return this;
  }

  createdAt(value: string): PipelinesRunBuilder {
    this.data.createdAt = value;
    return this;
  }

  updatedAt(value: string): PipelinesRunBuilder {
    this.data.updatedAt = value;
    return this;
  }

  startedAt(value?: string): PipelinesRunBuilder {
    this.data.startedAt = value;
    return this;
  }

  completedAt(value?: string): PipelinesRunBuilder {
    this.data.completedAt = value;
    return this;
  }

  branch(value: string): PipelinesRunBuilder {
    this.data.branch = value;
    return this;
  }

  commit(value?: string): PipelinesRunBuilder {
    this.data.commit = value;
    return this;
  }

  path(value: string): PipelinesRunBuilder {
    this.data.path = value;
    return this;
  }

  jobs(value?: PipelineJob[]): PipelinesRunBuilder {
    this.data.jobs = value;
    return this;
  }

  build(): PipelineRun {
    return { ...this.data };
  }
}
