/**
 * Mock Data Builders for Testing
 * Mirrors: api/tests/builders.py and related test builder files
 */

import {
  Commit,
  PullRequest,
  PipelineRun,
  Issue,
  CodeChange,
  CodeMetric,
} from '../../src/domain-types';

/**
 * Builder for creating mock Commit objects
 */
export class CommitBuilder {
  private commit: Commit = {
    author: 'Test Author',
    msg: 'Test commit message',
    hash: 'abc123def456',
    timestamp: new Date().toISOString(),
    files: [],
  };

  withAuthor(author: string): CommitBuilder {
    this.commit.author = author;
    return this;
  }

  withMessage(msg: string): CommitBuilder {
    this.commit.msg = msg;
    return this;
  }

  withHash(hash: string): CommitBuilder {
    this.commit.hash = hash;
    return this;
  }

  withTimestamp(timestamp: string): CommitBuilder {
    this.commit.timestamp = timestamp;
    return this;
  }

  withFiles(files: CodeChange[]): CommitBuilder {
    this.commit.files = files;
    return this;
  }

  build(): Commit {
    return { ...this.commit };
  }
}

/**
 * Builder for creating mock PullRequest objects
 */
export class PullRequestBuilder {
  private pr: any = {
    id: 1,
    number: 1,
    title: 'Test Pull Request',
    author: { login: 'Test Author', id: 1 },
    url: 'https://github.com/example/pr/1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    state: 'open',
    labels: [],
    comments: 0,
  };

  withId(id: number): PullRequestBuilder {
    this.pr.id = id;
    return this;
  }

  withNumber(number: number): PullRequestBuilder {
    this.pr.number = number;
    return this;
  }

  withTitle(title: string): PullRequestBuilder {
    this.pr.title = title;
    return this;
  }

  withAuthor(author: string): PullRequestBuilder {
    this.pr.author = { login: author, id: 1 };
    return this;
  }

  withState(state: 'open' | 'closed' | 'merged'): PullRequestBuilder {
    this.pr.state = state;
    return this;
  }

  withCreatedAt(createdAt: string): PullRequestBuilder {
    this.pr.createdAt = createdAt;
    return this;
  }

  withMergedAt(mergedAt: string): PullRequestBuilder {
    this.pr.mergedAt = mergedAt;
    this.pr.state = 'merged';
    return this;
  }

  withClosedAt(closedAt: string): PullRequestBuilder {
    this.pr.closedAt = closedAt;
    this.pr.state = 'closed';
    return this;
  }

  withComments(comments: number): PullRequestBuilder {
    this.pr.comments = comments;
    return this;
  }

  withLabels(labels: Array<{ name: string }>): PullRequestBuilder {
    this.pr.labels = labels;
    return this;
  }

  build(): any {
    return { ...this.pr };
  }
}

/**
 * Builder for creating mock PipelineRun objects
 */
export class PipelineRunBuilder {
  private run: any = {
    id: 'run-1',
    number: 1,
    name: 'Build',
    status: 'completed',
    conclusion: 'success',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
    branch: 'main',
    commit: 'abc123',
    path: '.github/workflows/build.yml',
    jobs: [],
  };

  withId(id: string): PipelineRunBuilder {
    this.run.id = id;
    return this;
  }

  withNumber(number: number): PipelineRunBuilder {
    this.run.number = number;
    return this;
  }

  withName(name: string): PipelineRunBuilder {
    this.run.name = name;
    return this;
  }

  withStatus(status: string): PipelineRunBuilder {
    this.run.status = status;
    return this;
  }

  withConclusion(conclusion: string): PipelineRunBuilder {
    this.run.conclusion = conclusion;
    return this;
  }

  withBranch(branch: string): PipelineRunBuilder {
    this.run.branch = branch;
    return this;
  }

  withCommit(commit: string): PipelineRunBuilder {
    this.run.commit = commit;
    return this;
  }

  withCreatedAt(createdAt: string): PipelineRunBuilder {
    this.run.createdAt = createdAt;
    return this;
  }

  withStartedAt(startedAt: string): PipelineRunBuilder {
    this.run.startedAt = startedAt;
    return this;
  }

  withCompletedAt(completedAt: string): PipelineRunBuilder {
    this.run.completedAt = completedAt;
    return this;
  }

  withPath(path: string): PipelineRunBuilder {
    this.run.path = path;
    return this;
  }

  withDuration(seconds: number): PipelineRunBuilder {
    this.run.durationSeconds = seconds;
    const startDate = new Date(this.run.startedAt);
    this.run.completedAt = new Date(startDate.getTime() + seconds * 1000).toISOString();
    return this;
  }

  build(): any {
    return { ...this.run };
  }
}

/**
 * Factory for creating test data collections
 */
export class TestDataFactory {
  static createCommits(count: number): Commit[] {
    const commits: Commit[] = [];
    for (let i = 0; i < count; i++) {
      commits.push(
        new CommitBuilder()
          .withHash(`commit${i}`)
          .withAuthor(`author${i % 3}`)
          .withMessage(`Commit message ${i}`)
          .build()
      );
    }
    return commits;
  }

  static createPullRequests(count: number): PullRequest[] {
    const prs: PullRequest[] = [];
    for (let i = 0; i < count; i++) {
      prs.push(
        new PullRequestBuilder()
          .withNumber(i + 1)
          .withAuthor(`author${i % 3}`)
          .withTitle(`PR: Feature ${i}`)
          .build()
      );
    }
    return prs;
  }

  static createPipelineRuns(count: number): PipelineRun[] {
    const runs: PipelineRun[] = [];
    for (let i = 0; i < count; i++) {
      runs.push(
        new PipelineRunBuilder()
          .withNumber(i + 1)
          .withCommit(`commit${i}`)
          .withDuration(Math.random() * 3600)
          .build()
      );
    }
    return runs;
  }
}
