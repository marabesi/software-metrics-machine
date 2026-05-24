import { WorkflowJobJsonResponse } from '../providers/github/github-response-types';

export class PipelineGitHubJobBuilder {
  private data: WorkflowJobJsonResponse = {
    created_at: '',
    head_branch: '',
    head_sha: '',
    html_url: '',
    node_id: '',
    run_attempt: '',
    run_url: '',
    url: '',
    workflow_name: '',
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

  completedAt(value: string): PipelineGitHubJobBuilder {
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

  build(): WorkflowJobJsonResponse {
    return { ...this.data };
  }
}
