/**
 * Tests for Mock Builders
 */

import { describe, it, expect } from 'vitest';
import {
  CommitBuilder,
  PullRequestBuilder,
  PipelineRunBuilder,
  TestDataFactory,
} from './builders';

describe('Mock Data Builders', () => {
  describe('CommitBuilder', () => {
    it('should create commit with default values', () => {
      const commit = new CommitBuilder().build();
      expect(commit.author).toBe('Test Author');
      expect(commit.hash).toBe('abc123def456');
      expect(commit.files).toEqual([]);
    });

    it('should build commit with custom values', () => {
      const commit = new CommitBuilder()
        .withAuthor('John Doe')
        .withMessage('Fix bug')
        .withHash('xyz789')
        .build();
      expect(commit.author).toBe('John Doe');
      expect(commit.msg).toBe('Fix bug');
      expect(commit.hash).toBe('xyz789');
    });
  });

  describe('PullRequestBuilder', () => {
    it('should create PR with default values', () => {
      const pr = new PullRequestBuilder().build();
      expect(pr.title).toBe('Test Pull Request');
      expect(pr.state).toBe('open');
    });

    it('should handle merged PR state', () => {
      const mergedDate = new Date();
      const pr = new PullRequestBuilder()
        .withMergedAt(mergedDate)
        .build();
      expect(pr.state).toBe('merged');
      expect(pr.mergedAt).toBe(mergedDate);
    });
  });

  describe('PipelineRunBuilder', () => {
    it('should create run with duration', () => {
      const run = new PipelineRunBuilder()
        .withDuration(300)
        .build();
      expect(run.durationSeconds).toBe(300);
      expect(run.completedAt).toBeDefined();
    });
  });

  describe('TestDataFactory', () => {
    it('should create multiple commits', () => {
      const commits = TestDataFactory.createCommits(5);
      expect(commits).toHaveLength(5);
      commits.forEach((commit, index) => {
        expect(commit.hash).toBe(`commit${index}`);
      });
    });

    it('should create multiple PRs', () => {
      const prs = TestDataFactory.createPullRequests(3);
      expect(prs).toHaveLength(3);
      prs.forEach((pr, index) => {
        expect(pr.number).toBe(index + 1);
      });
    });

    it('should create multiple pipeline runs', () => {
      const runs = TestDataFactory.createPipelineRuns(4);
      expect(runs).toHaveLength(4);
    });
  });
});
