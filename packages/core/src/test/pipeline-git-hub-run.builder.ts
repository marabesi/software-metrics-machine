import { WorkflowJsonResponse } from '../providers/github/github-response-types';

export class PipelineGitHubRunBuilder {
  private data: WorkflowJsonResponse = {
    id: 'run-1',
    run_number: '1',
    name: 'CI',
    status: 'completed',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    run_started_at: new Date().toISOString(),
    head_branch: 'main',
    head_sha: '1mna9sd',
    path: '.github/workflows/ci.yml',
    check_suite_id: '',
    check_suite_node_id: '',
    conclusion: '',
    display_title: '',
    event: '',
    html_url: '',
    node_id: '',
    run_attempt: '',
    url: '',
    workflow_id: '',
  };

  id(value: string): PipelineGitHubRunBuilder {
    this.data.id = value;
    return this;
  }

  number(value: string): PipelineGitHubRunBuilder {
    this.data.run_number = value;
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

  conclusion(value: string): PipelineGitHubRunBuilder {
    this.data.conclusion = value;
    return this;
  }

  event(value: string): PipelineGitHubRunBuilder {
    this.data.event = value;
    return this;
  }

  createdAt(value: string): PipelineGitHubRunBuilder {
    this.data.created_at = value;
    return this;
  }

  updatedAt(value: string): PipelineGitHubRunBuilder {
    this.data.updated_at = value;
    return this;
  }

  startedAt(value: string): PipelineGitHubRunBuilder {
    this.data.run_started_at = value;
    return this;
  }

  branch(value: string): PipelineGitHubRunBuilder {
    this.data.head_branch = value;
    return this;
  }

  commit(value: string): PipelineGitHubRunBuilder {
    this.data.head_sha = value;
    return this;
  }

  path(value: string): PipelineGitHubRunBuilder {
    this.data.path = value;
    return this;
  }

  build(): WorkflowJsonResponse {
    return { ...this.data };
  }
}
