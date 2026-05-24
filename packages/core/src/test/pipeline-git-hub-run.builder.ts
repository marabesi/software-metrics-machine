import type { PipelineJob, PipelineRun } from '../domain/pipelines/pipeline-types';

/**
 * Chainable builder for pipeline runs in tests.
 */
export class PipelineGitHubRunBuilder {
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

  id(value: string): PipelineGitHubRunBuilder {
    this.data.id = value;
    return this;
  }

  number(value: number): PipelineGitHubRunBuilder {
    this.data.number = value;
    return this;
  }

  name(value: string): PipelineGitHubRunBuilder {
    this.data.name = value;
    return this;
  }

  status(value: string): PipelineGitHubRunBuilder {
    this.data.status = value;
    return this;
  }

  conclusion(value?: string): PipelineGitHubRunBuilder {
    this.data.conclusion = value;
    return this;
  }

  createdAt(value: string): PipelineGitHubRunBuilder {
    this.data.createdAt = value;
    return this;
  }

  updatedAt(value: string): PipelineGitHubRunBuilder {
    this.data.updatedAt = value;
    return this;
  }

  startedAt(value?: string): PipelineGitHubRunBuilder {
    this.data.startedAt = value;
    return this;
  }

  completedAt(value?: string): PipelineGitHubRunBuilder {
    this.data.completedAt = value;
    return this;
  }

  branch(value: string): PipelineGitHubRunBuilder {
    this.data.branch = value;
    return this;
  }

  commit(value?: string): PipelineGitHubRunBuilder {
    this.data.commit = value;
    return this;
  }

  path(value: string): PipelineGitHubRunBuilder {
    this.data.path = value;
    return this;
  }

  jobs(value?: PipelineJob[]): PipelineGitHubRunBuilder {
    this.data.jobs = value;
    return this;
  }

  build(): PipelineRun {
    return { ...this.data };
  }
}
