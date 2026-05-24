import type { PipelineJob as PipelineJobType } from '../domain/pipelines/pipeline-types';

export class PipelineGitHubJobBuilder {
  private data: any = {
    id: 'job-1',
    run_id: 'run-1',
    name: 'build',
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    conclusion: 'success',
    status: 'completed',
  };

  id(value: string): PipelineGitHubJobBuilder {
    this.data.id = value;
    return this;
  }

  runId(value: string): PipelineGitHubJobBuilder {
    this.data.run_id = value;
    return this;
  }

  name(value: string): PipelineGitHubJobBuilder {
    this.data.name = value;
    return this;
  }

  startedAt(value: string): PipelineGitHubJobBuilder {
    this.data.started_at = value;
    return this;
  }

  completedAt(value?: string): PipelineGitHubJobBuilder {
    this.data.completed_at = value;
    return this;
  }

  conclusion(value: string): PipelineGitHubJobBuilder {
    this.data.conclusion = value;
    return this;
  }

  status(value: string): PipelineGitHubJobBuilder {
    this.data.status = value;
    return this;
  }

  durationSeconds(value?: number): PipelineGitHubJobBuilder {
    this.data.durationSeconds = value;
    return this;
  }

  build(): PipelineJobType {
    return { ...this.data };
  }
}
